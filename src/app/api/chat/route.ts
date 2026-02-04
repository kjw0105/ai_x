import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ClientMsg = { role: "user" | "ai"; text: string };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as ClientMsg[];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }

    // ✅ 클라이언트 role: "ai" -> OpenAI role: "assistant" 로 변환
    const chatMessages = [
      {
        role: "system" as const,
        content:
          "너는 산업안전 문서/현장 점검을 돕는 한국어 AI 도우미다. 짧고 명확하게 답하고, 필요하면 체크리스트로 정리한다.",
      },
      ...messages.map((m) => ({
        role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
        content: m.text ?? "",
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.3,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "(응답이 비어있어요)";

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("[/api/chat] error:", e);
    return NextResponse.json(
      { error: e?.message || "chat failed" },
      { status: 500 }
    );
  }
}
