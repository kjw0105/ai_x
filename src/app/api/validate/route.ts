// app/api/validate/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

type Provider = "openai" | "claude" | "auto";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt() {
  return `
너는 산업안전 서류 검증 AI다.
문서는 다음 3종 중 하나일 수 있다:
- 산업안전 점검표
- 위험성 평가 보고서
- 작업 전 안전점검표

출력은 반드시 "JSON만" 출력한다(설명/마크다운 금지).
스키마:
{
  "docType": "산업안전 점검표" | "위험성 평가 보고서" | "작업 전 안전점검표" | "unknown",
  "fields": {
    "점검일자": string|null,
    "현장명": string|null,
    "작업내용": string|null,
    "작업인원": string|null
  },
  "signature": {
    "담당": "present"|"missing"|"unknown",
    "소장": "present"|"missing"|"unknown"
  },
  "issues": [
    {"severity":"error"|"warn","title":string,"message":string}
  ],
  "chat": [
    {"role":"ai"|"user","text":string}
  ]
}

규칙:
- 필수 필드(점검일자/현장명/작업내용/작업인원) 누락 => error
- 결재/서명란이 비어있다고 판단되면 => error (unknown이면 warn)
- 불일치(예: 다른 문서와 인원 수 다름)는 근거가 있을 때만 warn로 제시
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

async function callOpenAI(opts: { pdfText?: string; pageImageDataUrl?: string | null }) {
  const content: any[] = [{ type: "input_text", text: buildSystemPrompt() }];

  if (opts.pdfText && opts.pdfText.trim().length >= 50) {
    content.push({ type: "input_text", text: `추출 텍스트:\n${opts.pdfText}` });
  }
  if (opts.pageImageDataUrl) {
    content.push({ type: "input_image", image_url: opts.pageImageDataUrl });
  }

  const r = await openai.responses.create({
    model: "gpt-4o", // 너 계정에서 쓰는 비전 모델로 바꿔도 됨
    input: [{ role: "user", content }],
  });

  return safeJsonParse(r.output_text ?? "");
}

async function callClaude(opts: { pdfText?: string; pageImageDataUrl?: string | null }) {
  const content: any[] = [];

  // 시스템 프롬프트는 첫 텍스트 블록에 함께 넣는 방식으로 간단히 처리
  content.push({ type: "text", text: buildSystemPrompt() });

  if (opts.pdfText && opts.pdfText.trim().length >= 50) {
    content.push({ type: "text", text: `추출 텍스트:\n${opts.pdfText}` });
  }

  if (opts.pageImageDataUrl) {
    // data:image/jpeg;base64,... 에서 base64만 분리
    const base64 = opts.pageImageDataUrl.split(",")[1] ?? "";
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: base64 },
    });
  }

  const msg = await anthropic.messages.create({
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
    const { provider, fileName, pdfText, pageImageDataUrl } = await req.json();

    const p: Provider = (provider ?? "auto") as Provider;

    // auto: 스캔(텍스트 거의 없음)이면 비전 강한 쪽(둘 중 아무거나)로
    // 여기선: 이미지 있으면 OpenAI 먼저, 없으면 Claude 먼저 같은 식으로도 가능
    let result: any;
    if (p === "openai") result = await callOpenAI({ pdfText, pageImageDataUrl });
    else if (p === "claude") result = await callClaude({ pdfText, pageImageDataUrl });
    else {
      // auto
      if (pageImageDataUrl) {
        // 스캔이면 OpenAI 시도 -> 실패하면 Claude
        try {
          result = await callOpenAI({ pdfText, pageImageDataUrl });
        } catch {
          result = await callClaude({ pdfText, pageImageDataUrl });
        }
      } else {
        // 텍스트면 Claude 시도 -> 실패하면 OpenAI
        try {
          result = await callClaude({ pdfText, pageImageDataUrl: null });
        } catch {
          result = await callOpenAI({ pdfText, pageImageDataUrl: null });
        }
      }
    }

    return NextResponse.json({ fileName, ...result });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "validate failed" }, { status: 500 });
  }
}
