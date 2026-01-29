"use client";

interface ChatMessage {
  role: "ai" | "user";
  text: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  loading?: boolean;
}

export function ChatPanel({ messages, loading }: ChatPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">분석 중...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-xs">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
            chat_bubble
          </span>
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
            분석 대기 중
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            문서를 업로드하면 AI 분석 결과가 여기 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`${
            msg.role === "ai"
              ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          } rounded-xl p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-lg">
              {msg.role === "ai" ? "psychology" : "person"}
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {msg.role === "ai" ? "AI 분석" : "사용자"}
            </span>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
}
