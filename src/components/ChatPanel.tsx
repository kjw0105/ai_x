"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import { exportReportToPDF } from "@/lib/pdfExport";

interface ChatMessage {
  role: "ai" | "user";
  text: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  loading?: boolean;
  currentProjectName?: string;
  currentFile?: File | null;
  historicalFileName?: string;
  issues?: any[];
}

export function ChatPanel({
  messages,
  loading,
  currentProjectName,
  currentFile,
  historicalFileName,
  issues = []
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInput("");

    // Add user message
    setChatMessages(prev => [...prev, { role: "user", text }]);

    // Simulate AI response (replace with actual API call later)
    await new Promise(r => setTimeout(r, 500));
    setChatMessages(prev => [
      ...prev,
      {
        role: "ai",
        text: "채팅 기능은 현재 준비 중입니다. 곧 실제 AI 응답을 제공할 예정입니다.",
      },
    ]);
    setIsSending(false);
  };

  const handleExportPDF = async () => {
    if (!currentFile && !historicalFileName) {
      toast?.warning("먼저 문서를 업로드하거나 기록을 선택하세요");
      return;
    }

    if (isExportingPDF) return;

    setIsExportingPDF(true);

    const exportData = {
      fileName: currentFile?.name ?? historicalFileName ?? "report",
      projectName: currentProjectName,
      documentType: null,
      createdAt: new Date().toISOString(),
      issues: issues.map(i => ({
        severity: i.severity,
        title: i.title,
        message: i.message,
        ruleId: i.ruleId,
      })),
      summary: {
        totalIssues: issues.length,
        criticalCount: issues.filter(i => i.severity === "error").length,
        warningCount: issues.filter(i => i.severity === "warn").length,
        infoCount: issues.filter(i => i.severity === "info").length,
      },
    };

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "report.pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast?.success("PDF 리포트가 다운로드되었습니다");
    } catch (error: any) {
      toast?.error(`PDF 생성에 실패했습니다. 브라우저에서 다시 시도합니다: ${error.message || "알 수 없는 오류"}`);

      try {
        await exportReportToPDF({
          ...exportData,
          createdAt: new Date(exportData.createdAt),
        });
        toast?.success("브라우저에서 PDF를 생성했습니다");
      } catch (fallbackError: any) {
        toast?.error(`브라우저 PDF 생성도 실패했습니다: ${fallbackError.message || "알 수 없는 오류"}`);
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

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

  const allMessages = [...messages, ...chatMessages];
  const reportExists = issues.length > 0 || messages.length > 0;

  if (allMessages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      {/* Header with PDF Export */}
      {reportExists && (currentFile || historicalFileName) && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">분석 결과</h4>
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-sm ${
              isExportingPDF
                ? "bg-slate-400 dark:bg-slate-600 text-white cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            }`}
            title={isExportingPDF ? "PDF 생성 중..." : "PDF로 보고서 내보내기"}
          >
            {isExportingPDF ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                <span className="hidden sm:inline">생성 중...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">download</span>
                <span className="hidden sm:inline">PDF 내보내기</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-4 ${
                msg.role === "ai"
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                  : "bg-primary text-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg">
                  {msg.role === "ai" ? "psychology" : "person"}
                </span>
                <span className={`text-xs font-bold ${msg.role === "ai" ? "text-slate-700 dark:text-slate-300" : "text-white"}`}>
                  {msg.role === "ai" ? "AI 분석" : "사용자"}
                </span>
              </div>
              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "ai" ? "text-slate-800 dark:text-slate-200" : "text-white"}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="메시지를 입력하세요…"
            type="text"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="size-10 rounded-xl bg-primary hover:bg-green-600 text-white disabled:opacity-40 disabled:hover:bg-primary transition-colors shadow-lg shadow-green-200 dark:shadow-none flex items-center justify-center shrink-0"
            aria-label="Send"
          >
            {isSending ? (
              <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-lg">send</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
