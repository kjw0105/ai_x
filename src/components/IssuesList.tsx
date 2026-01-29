"use client";

interface Issue {
  id: string;
  severity: "error" | "warn" | "info";
  title: string;
  message: string;
  ruleId?: string;
}

interface IssuesListProps {
  issues: Issue[];
  loading?: boolean;
}

export function IssuesList({ issues, loading }: IssuesListProps) {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
      case "warn":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300";
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300";
      default:
        return "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return "error";
      case "warn":
        return "warning";
      case "info":
        return "info";
      default:
        return "circle";
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

  if (issues.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-green-500 mb-4">
            check_circle
          </span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            문제 없음
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            검증 결과 발견된 문제가 없습니다
          </p>
        </div>
      </div>
    );
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warn").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return (
    <div className="flex flex-col h-full">
      {/* Summary Bar */}
      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 text-xs">
          {errorCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-red-500 text-sm">error</span>
              <span className="font-bold text-red-600 dark:text-red-400">{errorCount}</span>
            </div>
          )}
          {warnCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-yellow-500 text-sm">warning</span>
              <span className="font-bold text-yellow-600 dark:text-yellow-400">{warnCount}</span>
            </div>
          )}
          {infoCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-blue-500 text-sm">info</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{infoCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className={`p-3 rounded-lg border ${getSeverityStyles(issue.severity)} transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">
                {getSeverityIcon(issue.severity)}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm mb-1 leading-tight">{issue.title}</h4>
                {issue.ruleId && (
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                    {issue.ruleId}
                  </code>
                )}
              </div>
            </div>
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{issue.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
