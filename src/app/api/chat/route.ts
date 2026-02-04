import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  CHAT_TOOLS,
  explainIssue,
  getDocumentContext,
  suggestFix,
  type ReportContext
} from "@/lib/chatTools";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ClientMsg = { role: "user" | "ai"; text: string };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = (body?.messages ?? []) as ClientMsg[];
    const reportContext = (body?.reportContext ?? null) as ReportContext | null;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }

    // Enhanced system prompt with context awareness
    const systemPrompt = `너는 산업안전 문서 검증을 돕는 한국어 AI 안전 컨설턴트다.

당신의 역할:
- 검증 결과를 명확하게 설명
- 규칙 위반 이유와 수정 방법 제시
- 안전 관련 규정 참고 제공
- 친근하고 전문적인 어조 유지

사용 가능한 도구:
1. explain_issue(ruleId) - 특정 검증 규칙 상세 설명
2. get_document_context(includeChecklist) - 현재 문서 정보 조회
3. suggest_fix(issueId) - 이슈 해결 방법 제시

사용자가 다음과 같이 질문하면 도구를 사용하세요:
- "왜 이 경고가 나왔어요?" → explain_issue 사용
- "이 문서 요약해줘" → get_document_context 사용
- "어떻게 고치나요?" → suggest_fix 사용
- "rule_xxx를 설명해줘" → explain_issue 사용

답변 시 주의사항:
- 짧고 명확하게 답변
- 전문 용어는 쉽게 풀어서 설명
- 법규 위반이 아니라 "문서 불일치" 관점으로 설명
- 단계별로 정리하여 제시`;

    // Convert client messages to OpenAI format
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages.map((m) => ({
        role: (m.role === "ai" ? "assistant" : "user") as "assistant" | "user",
        content: m.text ?? "",
      })),
    ];

    // Call OpenAI with tools enabled
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      tools: CHAT_TOOLS,
      tool_choice: "auto",
      temperature: 0.3,
    });

    const responseMessage = completion.choices[0]?.message;

    // Handle tool calls
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCalls = responseMessage.tool_calls;

      // Add assistant message with tool calls to history
      chatMessages.push(responseMessage);

      // Execute each tool call
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[Tool Call] ${functionName}`, functionArgs);

        let toolResult = "";

        try {
          switch (functionName) {
            case "explain_issue":
              toolResult = explainIssue(functionArgs.ruleId, reportContext || {});
              break;

            case "get_document_context":
              toolResult = getDocumentContext(
                functionArgs.includeChecklist ?? true,
                reportContext || {}
              );
              break;

            case "suggest_fix":
              toolResult = suggestFix(functionArgs.issueId, reportContext || {});
              break;

            default:
              toolResult = `알 수 없는 도구: ${functionName}`;
          }
        } catch (error: any) {
          console.error(`[Tool Error] ${functionName}:`, error);
          toolResult = `도구 실행 중 오류가 발생했습니다: ${error.message}`;
        }

        // Add tool result to messages
        chatMessages.push({
          role: "tool",
          content: toolResult,
          tool_call_id: toolCall.id,
        });
      }

      // Get final response from AI with tool results
      const finalCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        temperature: 0.3,
      });

      const finalReply = finalCompletion.choices[0]?.message?.content?.trim() || "(응답이 비어있어요)";

      return NextResponse.json({ reply: finalReply });
    }

    // No tool calls - return direct response
    const reply = responseMessage?.content?.trim() || "(응답이 비어있어요)";

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("[/api/chat] error:", e);
    return NextResponse.json(
      { error: e?.message || "chat failed" },
      { status: 500 }
    );
  }
}
