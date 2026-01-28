export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : "";
}

function buildTBMSystemPrompt() {
  return `
너는 건설/산업현장의 TBM(작업 전 대화) 기록을 분석하는 AI다.

사용자가 녹음한 대화를 전사한 텍스트를 바탕으로 아래 형식으로 요약해라.
한국어로, 현장 실무자가 바로 쓸 수 있게 간결하고 구조적으로.

요약 포맷:
1) 오늘 작업 개요
2) 주요 위험요인 (최대 5개)
3) 예방/통제 조치 (위험요인과 1:1로 매칭되면 좋음)
4) PPE/장비 체크
5) 역할/담당 및 연락 체계
6) 결정사항/액션아이템 (담당자/기한이 언급되면 포함)
7) 누락/불명확한 부분 (확인 필요 사항)

주의:
- 사실에 근거해 작성하고, 추측은 "추정"으로 표시.
- 개인 비난/판단 금지.
`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    const projectId = safeText(form.get("projectId"));

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json({ error: "audio 파일이 필요합니다." }, { status: 400 });
    }

    // 1) Transcribe
    const transcriptRes = await getOpenAI().audio.transcriptions.create({
      model: "whisper-1",
      file: audio,
      language: "ko",
    });

    const transcript = safeText((transcriptRes as any).text);
    if (!transcript.trim()) {
      return NextResponse.json({ error: "전사 결과가 비어있습니다." }, { status: 500 });
    }

    // 2) Summarize / Analyze
    const contextLine = projectId ? `\n\n[PROJECT_ID]\n${projectId}` : "";
    const summaryRes = await getOpenAI().responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: buildTBMSystemPrompt(),
        },
        {
          role: "user",
          content: `다음은 TBM 녹음 전사본이다. 이를 요약해라.\n\n[TRANSCRIPT]\n${transcript}${contextLine}`,
        },
      ],
    });

    const summary = safeText((summaryRes as any).output_text);

    return NextResponse.json({ transcript, summary });
  } catch (e: any) {
    console.error("/api/tbm error:", e);
    return NextResponse.json(
      { error: e?.message ?? "TBM 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
