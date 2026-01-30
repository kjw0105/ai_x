// app/api/validate/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { validateDocument, type DocData, type ValidationIssue } from "@/lib/validator";
import { prisma } from "@/lib/db";
import { analyzeInspectorPatterns, patternWarningsToIssues } from "@/lib/patternAnalysis";
import { validateAgainstStructuredPlan } from "@/lib/structuredValidation";
import type { MasterSafetyPlan, StructuredValidationIssue } from "@/lib/masterPlanSchema";
import { calculateRiskLevel, riskCalculationToIssues } from "@/lib/riskMatrix";
import { analyzeCrossDocumentIssues, crossDocumentIssuesToValidationIssues } from "@/lib/crossDocumentAnalysis";
import { parseDocExtraction } from "@/lib/docSchema";

type Provider = "openai" | "claude" | "auto";

// Helper to safely get OpenAI client
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

// Helper to safely get Anthropic client
function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function buildSystemPrompt() {
  return `
너는 산업안전 서류 검증 AI다. 정해진 스키마에 맞춰 정보를 "있는 그대로" 추출하라.
판단하지 말고, 문서에 적힌 텍스트와 내용을 기반으로 값을 채워라.

출력은 반드시 "JSON만" 출력한다(설명/마크다운 금지).
스키마:
{
  "docType": "산업안전 점검표" | "위험성 평가 보고서" | "작업 전 안전점검표" | "TBM" | "unknown",
  "fields": {
    "점검일자": string|null,   // 예: 2024-05-20, 식별 불가시 null
    "현장명": string|null,
    "작업내용": string|null,
    "작업인원": string|null    // 예: "3명", "홍길동 외 2명" 등
  },
  "signature": {
    "담당": "present"|"missing"|"unknown", // 담당자/작업반장 등 실무자 서명
    "소장": "present"|"missing"|"unknown"  // 관리책임자/소장 서명
  },
  "inspectorName": string|null,  // 점검자/담당자 이름 (예: "김철수", "박안전")
  "riskLevel": "high"|"medium"|"low"|null,  // 문서에 표시된 위험도 수준
  "checklist": [  // 체크리스트 항목들 (있는 경우만)
    {
      "id": string,     // 항목 ID (fall_01, ppe_03 등)
      "category": string,  // 분류 (추락예방, 보호구, 전기안전 등)
      "nameKo": string,    // 한국어 항목명
      "value": "✔"|"✖"|"N/A"|null  // 체크 상태
    }
  ],
  "chat": [
     {"role":"ai", "text": "문서 요약 및 특이사항 한줄 코멘트"}
  ]
}

체크리스트 ID 규칙:
- fall_01: 고소작업, fall_02: 추락방호장치, fall_03: 안전난간
- ppe_01: 안전모착용, ppe_03: 안전대착용
- fire_01: 화기작업, fire_02: 소화기비치
- conf_01: 밀폐공간작업, conf_02: 산소농도측정, conf_03: 환기조치
- exc_01: 굴착작업, exc_02: 흙막이설치, exc_03: 탈출사다리
- elec_02: 전기작업, elec_03: 잠금장치

주의:
- "issues" 필드는 생성하지 마라. (검증은 별도 로직으로 수행함)
- 서명란이 비어있으면 "missing"으로 표시하라.
- 내용을 찾을 수 없으면 null 또는 "unknown"을 사용하라.
- 사용자가 "프로젝트 규칙" 또는 "마스터 플랜"을 제공한 경우(아래 Context), 그 규칙에 위배되는 사항이 있다면 특이사항(chat)에 언급하라.
- chat 메시지는 비판단적(non-judgmental) 어조를 사용하라: "불일치가 존재함", "기록 누락됨" 등으로 표현하고, "위험함", "잘못됨" 같은 판단 표현은 피하라.
`;
}

function safeJsonParse(text: string) {
  const trimmed = (text ?? "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // JSON만 달라고 해도 앞뒤로 말이 붙는 경우 대비
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
}

function sanitizeDocData(raw: unknown) {
  return parseDocExtraction(raw);
}

async function callOpenAI(opts: { pdfText?: string; pageImages?: string[] | null; contextText?: string }) {
  let sysPrompt = buildSystemPrompt();

  if (opts.contextText) {
    sysPrompt += `\n\n[PROJECT CONTEXT / MASTER PLAN]\n다음은 이 현장의 마스터 안전 계획이다. 이 내용을 참고하여 위반 사항이나 불일치 점이 있으면 지적하라:\n${opts.contextText}`;
  }

  const content: any[] = [{ type: "input_text", text: sysPrompt }];

  if (opts.pdfText && opts.pdfText.trim().length >= 50) {
    content.push({ type: "input_text", text: `추출 텍스트:\n${opts.pdfText}` });
  }
  if (opts.pageImages?.length) {
    for (const img of opts.pageImages) {
      content.push({ type: "input_image", image_url: img });
    }
  }

  const r = await getOpenAI().responses.create({
    model: "gpt-4o", // 너 계정에서 쓰는 비전 모델로 바꿔도 됨
    input: [{ role: "user", content }],
  });

  return safeJsonParse(r.output_text ?? "");
}

async function callClaude(opts: { pdfText?: string; pageImages?: string[] | null; contextText?: string }) {
  const content: any[] = [];

  // 시스템 프롬프트는 첫 텍스트 블록에 함께 넣는 방식으로 간단히 처리
  let sysPrompt = buildSystemPrompt();
  if (opts.contextText) {
    sysPrompt += `\n\n[PROJECT CONTEXT / MASTER PLAN]\n다음은 이 현장의 마스터 안전 계획이다. 이 내용을 참고하여 위반 사항이나 불일치 점이 있으면 지적하라:\n${opts.contextText}`;
  }
  content.push({ type: "text", text: sysPrompt });

  if (opts.pdfText && opts.pdfText.trim().length >= 50) {
    content.push({ type: "text", text: `추출 텍스트:\n${opts.pdfText}` });
  }

  if (opts.pageImages?.length) {
    for (const img of opts.pageImages) {
      // data:image/jpeg;base64,... 에서 base64만 분리
      const base64 = img.split(",")[1] ?? "";
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: base64 },
      });
    }
  }

  const msg = await getAnthropic().messages.create({
    model: "claude-sonnet-4-5-20250929", // 너 계정에서 가능한 모델로 바꿔도 됨
    max_tokens: 1500,
    messages: [{ role: "user", content }],
  });

  // Claude 응답은 content 배열로 오니까 text만 합치기
  const outText =
    msg.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n") ?? "";

  return safeJsonParse(outText);
}

export async function POST(req: Request) {
  try {
    const { provider, fileName, pdfText, pageImages, projectId, documentType, tempContextText } = await req.json();

    // VALIDATION: Check if document has sufficient content
    const hasText = pdfText && pdfText.trim().length >= 50;
    const hasImages = pageImages && pageImages.length > 0;

    if (!hasText && !hasImages) {
      return NextResponse.json(
        {
          error: "문서에 내용이 없거나 읽을 수 없습니다",
          fileName: fileName ?? "Untitled",
          issues: [],
          chat: [
            {
              role: "ai",
              text: "업로드된 문서가 비어있거나 내용을 읽을 수 없습니다. 올바른 안전 점검 문서를 업로드해주세요."
            }
          ]
        },
        { status: 400 }
      );
    }

    const p: Provider = (provider ?? "auto") as Provider;

    // Fetch Project Context if projectId is present, or use temporary context
    let contextText = "";
    let masterPlan: MasterSafetyPlan | null = null;
    let projectIsStructured = false;

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      if (project) {
        // Legacy free-text context
        if (project.contextText) {
          contextText = project.contextText;
        }
        // New structured master plan
        if (project.isStructured && project.masterPlanJson) {
          try {
            masterPlan = JSON.parse(project.masterPlanJson) as MasterSafetyPlan;
            projectIsStructured = true;
          } catch (e) {
            console.error("Failed to parse master plan JSON:", e);
          }
        }
      }
    } else if (tempContextText) {
      // Use temporary master doc context for non-project validation
      contextText = tempContextText;
    }

    // auto: 스캔(텍스트 거의 없음)이면 비전 강한 쪽(둘 중 아무거나)로
    // 여기선: 이미지 있으면 OpenAI 먼저, 없으면 Claude 먼저 같은 식으로도 가능
    let result: any;
    if (p === "openai") result = await callOpenAI({ pdfText, pageImages, contextText });
    else if (p === "claude") result = await callClaude({ pdfText, pageImages, contextText });
    else {
      // auto
      if (pageImages?.length) {
        // 스캔이면 OpenAI 시도 -> 실패하면 Claude
        try {
          result = await callOpenAI({ pdfText, pageImages, contextText });
        } catch {
          result = await callClaude({ pdfText, pageImages, contextText });
        }
      } else {
        // 텍스트면 Claude 시도 -> 실패하면 OpenAI
        try {
          result = await callClaude({ pdfText, pageImages: null, contextText });
        } catch {
          result = await callOpenAI({ pdfText, pageImages: null, contextText });
        }
      }
    }

    // 3. Validation Logic (Code-based)
    // LLM 결과(extraction)에 대해 규칙 검사를 수행한다.
    const sanitized = sanitizeDocData(result);
    if ("error" in sanitized) {
      return NextResponse.json(
        {
          error: sanitized.error
        },
        { status: 400 }
      );
    }

    const extracted = sanitized.data;

    // VALIDATION: Check if document is safety-related
    // If docType is "unknown" and no safety-related fields are found, reject the document
    const isSafetyDocument =
      extracted.docType !== "unknown" ||
      (extracted.fields?.점검일자 ?? false) ||
      (extracted.fields?.현장명 ?? false) ||
      (extracted.fields?.작업내용 ?? false) ||
      (extracted.signature?.담당 && extracted.signature.담당 !== "unknown") ||
      (extracted.signature?.소장 && extracted.signature.소장 !== "unknown") ||
      (extracted.checklist?.length ?? 0) > 0;

    if (!isSafetyDocument) {
      return NextResponse.json(
        {
          error: "안전 점검 문서가 아닌 것으로 판단됩니다",
          fileName: fileName ?? "Untitled",
          issues: [],
          chat: [
            {
              role: "ai",
              text: "업로드된 문서는 안전 점검 관련 문서가 아닌 것으로 보입니다. 산업안전 점검표, 위험성 평가 보고서, TBM 결과 등 안전 점검 문서를 업로드해주세요."
            }
          ]
        },
        { status: 400 }
      );
    }

    const validationIssues = validateDocument(extracted);

    // Stage 3: Structured Master Plan Validation
    let structuredIssues: StructuredValidationIssue[] = [];
    if (masterPlan && projectIsStructured) {
      try {
        structuredIssues = validateAgainstStructuredPlan(extracted, masterPlan);
      } catch (e) {
        console.warn("Structured validation failed:", e);
        // Non-critical, continue without structured validation
      }
    }

    // Stage 3: Risk Matrix Calculation
    let riskIssues: typeof validationIssues = [];
    try {
      const riskCalculation = calculateRiskLevel(extracted);
      riskIssues = riskCalculationToIssues(riskCalculation);
    } catch (e) {
      console.warn("Risk calculation failed:", e);
      // Non-critical, continue without risk analysis
    }

    const reportId = crypto.randomUUID();

    // Stage 4: Pattern Analysis - Check for suspicious patterns
    let patternIssues: typeof validationIssues = [];
    if (extracted.inspectorName) {
      try {
        const patternWarnings = await analyzeInspectorPatterns(
          extracted.inspectorName,
          projectId ?? undefined
        );
        patternIssues = patternWarningsToIssues(patternWarnings);
      } catch (e) {
        console.warn("Pattern analysis failed:", e);
        // Non-critical, continue without pattern warnings
      }
    }

    // Stage 3: Cross-Document Analysis
    let crossDocIssues: typeof validationIssues = [];
    if (projectId) {
      try {
        const crossIssues = await analyzeCrossDocumentIssues(projectId, reportId);
        crossDocIssues = crossDocumentIssuesToValidationIssues(crossIssues);
      } catch (e) {
        console.warn("Cross-document analysis failed:", e);
        // Non-critical, continue without cross-document analysis
      }
    }

    // Merge all issues: validation + structured + risk + pattern + cross-document analysis
    const allIssues = [...validationIssues, ...structuredIssues, ...riskIssues, ...patternIssues, ...crossDocIssues].map(issue => ({
      ...issue,
      id: crypto.randomUUID()
    }));
    // --- DB SAVE ---
    // Save the result to the database for history (including Stage 4 fields)
    const extractedChat = Array.isArray((extracted as { chat?: unknown }).chat)
      ? JSON.stringify((extracted as { chat?: unknown[] }).chat)
      : null;
    const savedReport = await prisma.report.create({
      data: {
        id: reportId,
        fileName: fileName ?? "Untitled",
        docDataJson: JSON.stringify(extracted),
        issuesJson: JSON.stringify(allIssues),
        chatJson: extractedChat,
        projectId: projectId ?? null,
        documentType: documentType ?? null,
        // Stage 4: Save inspector name and checklist for pattern analysis
        inspectorName: extracted.inspectorName ?? null,
        checklistJson: extracted.checklist ? JSON.stringify(extracted.checklist) : null,
      }
    });

    // Stage 5: Risk Signals - Format output with non-judgmental language
    const riskSignals = allIssues
      .filter(issue => issue.ruleId?.startsWith("pattern_"))
      .map(issue => ({
        type: issue.ruleId,
        message: issue.message,
      }));

    const finalResult = {
      ...extracted,
      issues: allIssues,
      riskSignals,
    };

    return NextResponse.json({
      fileName,
      ...finalResult,
      reportId: savedReport.id
    });
  } catch (e: any) {
    console.error("Validation Error:", e);
    const msg = e?.message ?? "validate failed";

    // API Key missing errors
    if (msg.includes("API_KEY is not set")) {
      return NextResponse.json(
        {
          error: "API Key 설정이 필요합니다.",
          details: msg,
          solution: ".env.local 파일에 API Key를 추가해주세요."
        },
        { status: 500 } // Server misconfiguration -> 500 implies admin action needed
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
