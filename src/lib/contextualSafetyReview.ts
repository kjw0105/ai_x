/**
 * Contextual Safety Review (Stage 5 Enhancement)
 *
 * Performs AI reasoning on extracted document data to identify safety concerns
 * that aren't covered by the checklist but are implied by the work context.
 *
 * Examples:
 * - Outdoor electrical work → flag weather/rain risk
 * - Night-time height work → flag lighting concerns
 * - Confined space with 1 worker → flag lone worker risk
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ValidationIssue } from "./validator";

export interface ExtractedDocData {
  docType: string;
  fields: {
    점검일자?: string | null;
    현장명?: string | null;
    작업내용?: string | null;
    작업인원?: string | null;
    풍속?: string;
    기온?: string;
    강우량?: string;
    [key: string]: string | null | undefined;
  };
  checklist: { id: string; nameKo: string; value: string }[];
  riskLevel?: string | null;
}

interface ContextualConcern {
  concern: string;        // Korean description of the concern
  reasoning: string;      // Why this is a concern given the work context
  severity: "error" | "warn" | "info";
  category: string;       // e.g., "weather_risk", "lone_worker", "missing_precaution"
  regulation?: string;    // Optional Korean safety law reference
}

const REVIEW_PROMPT = `너는 건설 현장 안전 전문가다. 아래 문서 데이터를 검토하고, 체크리스트에는 없지만 작업 내용과 현장 상황을 고려했을 때 주의해야 할 안전 우려사항을 찾아라.

중요: 체크리스트 항목 간의 불일치(예: 화기작업=✔인데 소화기=✖)는 이미 별도 시스템에서 검출한다. 그런 것은 무시하라.

네가 찾아야 할 것은:
1. 작업 내용에 내재된 위험 요소 (예: "야외 전기작업" → 기상 조건 확인 필요)
2. 작업 환경과 체크리스트 사이의 논리적 빈틈 (예: 야외작업인데 기상 관련 점검 항목이 없음)
3. 작업 인원과 작업 위험도의 불균형 (예: 고위험 작업에 1인 작업)
4. 시간/계절적 위험 요소 (예: 동절기 콘크리트 타설, 야간 고소작업)
5. 법규에서 요구하지만 체크리스트에 반영되지 않은 조치

출력은 반드시 JSON만 출력한다(설명/마크다운 금지).
스키마:
{
  "concerns": [
    {
      "concern": "우려사항 제목 (한국어)",
      "reasoning": "이 작업에서 왜 이것이 우려되는지 구체적 설명",
      "severity": "error" | "warn" | "info",
      "category": "weather_risk" | "lone_worker" | "missing_precaution" | "environmental" | "temporal" | "regulatory_gap",
      "regulation": "관련 법규 (있는 경우, 예: 산업안전보건기준에 관한 규칙 제311조)"
    }
  ]
}

우려사항이 없으면 빈 배열을 반환하라: {"concerns": []}

심각도 기준:
- error: 즉시 생명 위협 가능 (예: 우천 시 전기작업, 밀폐공간 무환기 진입)
- warn: 사고 위험 증가 (예: 야간 고소작업 시 조명 미확인, 1인 작업)
- info: 개선 권고 (예: 추가 보호구 권장, 비상연락체계 확인)

주의사항:
- 확실한 것만 지적하라. 억지로 우려사항을 만들지 마라.
- 최대 5개까지만 제시하라.
- 비판단적 어조를 사용하라: "～의 위험이 있음", "～확인이 필요함"
`;

/**
 * Build a concise summary of the extracted document for the review prompt.
 * Keep it short to minimize tokens.
 */
function buildDocSummary(doc: ExtractedDocData, projectContext?: string): string {
  let summary = `[문서 정보]
- 작업내용: ${doc.fields.작업내용 || "미기재"}
- 현장명: ${doc.fields.현장명 || "미기재"}
- 점검일자: ${doc.fields.점검일자 || "미기재"}
- 작업인원: ${doc.fields.작업인원 || "미기재"}`;

  // Add weather data if present
  if (doc.fields.풍속 || doc.fields.기온 || doc.fields.강우량) {
    summary += `\n- 풍속: ${doc.fields.풍속 || "미기재"}`;
    summary += `\n- 기온: ${doc.fields.기온 || "미기재"}`;
    summary += `\n- 강우량: ${doc.fields.강우량 || "미기재"}`;
  }

  // Add checklist summary (only checked and unchecked items, skip N/A)
  const activeItems = doc.checklist.filter(c => c.value === "✔" || c.value === "✖");
  if (activeItems.length > 0) {
    summary += `\n\n[수행 중인 작업 (체크리스트에서 ✔ 또는 ✖ 표시된 항목)]`;
    for (const item of activeItems) {
      summary += `\n- ${item.nameKo}: ${item.value}`;
    }
  }

  if (projectContext) {
    summary += `\n\n[프로젝트 안전 규칙]\n${projectContext}`;
  }

  return summary;
}

/**
 * Run contextual safety review using Claude (primary) or GPT-5.1 (fallback).
 * Returns additional validation issues based on contextual reasoning.
 */
export async function runContextualSafetyReview(
  doc: ExtractedDocData,
  options?: {
    projectContext?: string;
    anthropicClient?: Anthropic;
    openaiClient?: OpenAI;
  }
): Promise<ValidationIssue[]> {
  // Skip if no work content to reason about
  if (!doc.fields.작업내용) {
    console.log("[Contextual Review] Skipping - no 작업내용 field");
    return [];
  }

  const docSummary = buildDocSummary(doc, options?.projectContext);
  const fullPrompt = `${REVIEW_PROMPT}\n\n${docSummary}`;

  let responseText = "";

  // Try Claude first (better at nuanced reasoning)
  if (options?.anthropicClient) {
    try {
      console.log("[Contextual Review] Using Claude...");
      const msg = await options.anthropicClient.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 800,
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0,
      });

      responseText = msg.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n");
    } catch (err) {
      console.warn("[Contextual Review] Claude failed, trying GPT-5.1:", err);
    }
  }

  // Fallback to GPT-5.1
  if (!responseText && options?.openaiClient) {
    try {
      console.log("[Contextual Review] Using GPT-5.1...");
      const completion = await options.openaiClient.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: fullPrompt }],
        max_completion_tokens: 800,
        temperature: 0,
      });
      responseText = completion.choices[0]?.message?.content ?? "";
    } catch (err) {
      console.warn("[Contextual Review] GPT-5.1 also failed:", err);
      return []; // Non-critical, return empty
    }
  }

  if (!responseText) {
    console.log("[Contextual Review] No response received");
    return [];
  }

  // Parse response
  try {
    const trimmed = responseText.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) {
      console.warn("[Contextual Review] No JSON found in response");
      return [];
    }

    const parsed = JSON.parse(trimmed.slice(start, end + 1));
    const concerns: ContextualConcern[] = parsed.concerns || [];

    console.log(`[Contextual Review] Found ${concerns.length} contextual concerns`);

    // Convert concerns to ValidationIssues
    return concerns.map((c, idx) => ({
      severity: c.severity as "error" | "warn" | "info",
      title: `[상황 분석] ${c.concern}`,
      message: `${c.reasoning}${c.regulation ? `\n\n관련 법규: ${c.regulation}` : ""}`,
      ruleId: `contextual_${c.category}_${idx}`,
      isAIFixable: false,
      path: `상황분석.${c.category}`,
    }));
  } catch (err) {
    console.warn("[Contextual Review] Failed to parse response:", err);
    return [];
  }
}
