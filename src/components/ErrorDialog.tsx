"use client";

import { ErrorDetails } from "@/lib/errorMessages";

interface ErrorDialogProps {
  error: ErrorDetails;
  onClose: () => void;
  onRetry?: () => void;
}

export function ErrorDialog({ error, onClose, onRetry }: ErrorDialogProps) {
  const iconMap = {
    error: "error",
    warning: "warning",
    info: "info",
  };

  const colorMap = {
    error: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-900 dark:text-red-100",
      icon: "text-red-600 dark:text-red-400",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-900 dark:text-yellow-100",
      icon: "text-yellow-600 dark:text-yellow-400",
      button: "bg-yellow-600 hover:bg-yellow-700 text-white",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-900 dark:text-blue-100",
      icon: "text-blue-600 dark:text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const colors = colorMap[error.type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`max-w-md w-full rounded-2xl border-2 shadow-2xl ${colors.bg} ${colors.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div
            className={`size-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}
          >
            <span className={`material-symbols-outlined text-3xl ${colors.icon}`}>
              {iconMap[error.type]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-xl font-black ${colors.text} mb-2`}>
              {error.title}
            </h3>
            {error.message && (
              <p className={`text-sm ${colors.text} opacity-90 whitespace-pre-line`}>
                {error.message}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors shrink-0"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-slate-500">close</span>
          </button>
        </div>

        {/* Solution */}
        {error.solution && (
          <div className="px-6 pb-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-2 mb-2">
                <span className="material-symbols-outlined text-lg text-blue-600 dark:text-blue-400 mt-0.5">
                  lightbulb
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  해결 방법
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line ml-7">
                {error.solution}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 pb-6">
          {onRetry && error.action && (
            <button
              onClick={() => {
                onRetry();
                onClose();
              }}
              className={`flex-1 px-4 py-3 rounded-xl font-bold transition-colors ${colors.button}`}
            >
              {error.action}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold transition-colors"
          >
            {onRetry ? "취소" : "확인"}
          </button>
        </div>
      </div>
    </div>
  );
}
