"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatModal({
  open,
  onClose,
  title = "AI 안전도우미 채팅",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uid(),
      role: "assistant",
      text: "안녕하세요! 무엇을 도와드릴까요? 🙂",
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  useEffect(() => {
    if (!open) return;
    // Scroll to bottom on open
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInput("");

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", text, createdAt: Date.now() },
    ]);

    // NOTE: 아직 전용 채팅 API가 없어서, UI만 먼저 붙여둔 상태입니다.
    // 나중에 /api/chat 같은 엔드포인트가 생기면 여기서 fetch로 연결하면 됩니다.
    await new Promise((r) => setTimeout(r, 500));
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        text: "지금은 채팅 연결을 준비 중이에요. (UI만 먼저 적용됨)\n원하시면 다음 단계로 실제 AI 응답까지 붙여드릴게요!",
        createdAt: Date.now(),
      },
    ]);
    setIsSending(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-3">
      <div className="w-full sm:max-w-2xl bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="material-symbols-outlined">forum</span>
            </div>
            <div>
              <div className="font-black text-slate-900 dark:text-white">{title}</div>
              <div className="text-xs text-slate-500">말풍선을 눌러서 채팅을 여는 UX</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Messages */}
        <div ref={listRef} className="h-[60vh] sm:h-[520px] overflow-y-auto px-5 py-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm whitespace-pre-wrap text-[15px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-white dark:bg-surface-dark text-slate-800 dark:text-white rounded-bl-none"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 px-5 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary"
              placeholder="메시지를 입력하세요…"
              type="text"
            />
            <button
              onClick={send}
              disabled={!canSend}
              className="size-12 rounded-full bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-40 disabled:hover:bg-yellow-400 transition-colors shadow-sm flex items-center justify-center"
              aria-label="Send"
            >
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
