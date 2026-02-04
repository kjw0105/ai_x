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
`.trim();
}

function normalizeAudioFile(file: File) {
  const type = (file.type || "").toLowerCase();

  let ext = "webm";
  if (type.includes("x-m4a") || type.includes("m4a") || type.includes("mp4")) ext = "m4a";
  else if (type.includes("mpeg") || type.includes("mp3")) ext = "mp3";
  else if (type.includes("wav")) ext = "wav";
  else if (type.includes("ogg") || type.includes("oga")) ext = "ogg";
  else if (type.includes("webm")) ext = "webm";

  // Whisper가 포맷 힌트를 더 잘 잡게 파일명/확장자를 맞춰서 새 File로 감쌈
  const fixedName = `tbm.${ext}`;
  return new File([file], fixedName, { type: file.type || "application/octet-stream" });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    const projectId = safeText(form.get("projectId"));

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json({ error: "audio 파일이 필요합니다." }, { status: 400 });
    }

    console.log("[TBM] audio:", { name: audio.name, type: audio.type, size: audio.size });

    if (audio.size < 8000) {
      return NextResponse.json({ error: "오디오 파일이 너무 작거나 비어있습니다." }, { status: 400 });
    }

    // MIME은 환경마다 제멋대로라서 "차단"보다 "경고 후 진행"이 안정적
    const type = (audio.type || "").toLowerCase();
    const allowed = new Set([
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/x-m4a",
      "audio/aac",
      "video/mp4",
    ]);

    if (type && !allowed.has(type)) {
      console.warn("[TBM] unknown mime type, proceed anyway:", type);
    }

    const client = getOpenAI();
    const normalizedAudio = normalizeAudioFile(audio);

    // 1) Transcribe (Whisper)
    console.log("[TBM] step=transcribe start");
    const transcriptRes = await client.audio.transcriptions.create({
      model: "whisper-1",
      file: normalizedAudio,
      language: "ko",
    });
    console.log("[TBM] step=transcribe done");

    const transcript = safeText((transcriptRes as any).text);
    if (!transcript.trim()) {
      return NextResponse.json({ error: "전사 결과가 비어있습니다." }, { status: 500 });
    }

    // 2) Summarize
    console.log("[TBM] step=summarize start");
    const contextLine = projectId ? `\n\n[PROJECT_ID]\n${projectId}` : "";
    const summaryRes = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: buildTBMSystemPrompt() },
        {
          role: "user",
          content: `다음은 TBM 녹음 전사본이다. 이를 요약해라.\n\n[TRANSCRIPT]\n${transcript}${contextLine}`,
        },
      ],
    });
    console.log("[TBM] step=summarize done");

    const summary = safeText((summaryRes as any).output_text);

    return NextResponse.json({ transcript, summary });
  } catch (e: any) {
    console.error("/api/tbm error raw:", e);
    const msg =
      e?.response?.data?.error?.message ||
      e?.error?.message ||
      e?.message ||
      "TBM 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
