
"use client";

function severityBorder(sev: string, ruleId?: string) {
    // Stage 5: Risk signals get distinct purple styling
    if (ruleId?.startsWith("pattern_")) return "border-l-purple-500";
    if (sev === "error") return "border-l-red-500";
    if (sev === "warn") return "border-l-orange-500";
    return "border-l-slate-400";
}

function severityColor(sev: string, ruleId?: string) {
    if (ruleId?.startsWith("pattern_")) return "text-purple-600";
    if (sev === "error") return "text-red-600";
    if (sev === "warn") return "text-orange-600";
    return "text-slate-600";
}

function severityIcon(sev: string, ruleId?: string) {
    if (ruleId?.startsWith("pattern_")) return "query_stats"; // Pattern analysis icon
    if (sev === "error") return "edit_off";
    if (sev === "warn") return "warning";
    return "info";
}

interface Issue {
    id: string;
    severity: "error" | "warn" | "info";
    title: string;
    message: string;
    ruleId?: string; // Stage 2-5: Link to specific rule
}

interface AnalysisPanelProps {
    loading: boolean;
    issues: Issue[];
    chatMessages: { role: "ai" | "user"; text: string }[];
    onReupload: () => void;
    onModify: () => void;
    currentProjectName?: string;
}

export default function AnalysisPanel({ loading, issues, chatMessages, onReupload, onModify, currentProjectName }: AnalysisPanelProps) {
    const reportExists = issues.length > 0 || chatMessages.length > 0;

    // Separate regular issues from pattern warnings (Stage 5)
    const regularIssues = issues.filter(i => !i.ruleId?.startsWith("pattern_"));
    const patternWarnings = issues.filter(i => i.ruleId?.startsWith("pattern_"));

    // Default welcome message if no chat
    const messages = chatMessages.length > 0 ? chatMessages : [
        { role: "ai", text: "안녕하세요! 👋\n서류를 올려주시면 빠진 항목/불일치/수정사항을 찾아드릴게요." }
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-2xl relative">
            <div className="shrink-0 bg-white dark:bg-surface-dark p-6 border-b border-slate-100 dark:border-slate-700 shadow-sm relative z-10">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="size-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 border-2 border-blue-200">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-300 text-4xl">
                                smart_toy
                            </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 size-5 rounded-full border-2 border-white" />
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">AI 안전도우미</h2>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20" suppressHydrationWarning>
                                {loading ? "분석 중..." : reportExists ? "분석 완료" : "대기 중"}
                            </span>
                            {currentProjectName && (
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                    <span className="material-symbols-outlined text-[10px] mr-1">business</span>
                                    {currentProjectName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-[#1a2233]">
                <div className="flex justify-center">
                    <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">오늘</span>
                </div>

                {/* Chat Messages */}
                {messages.map((msg, idx) => (
                    <div key={idx} className="chat-message flex gap-3">
                        <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                            <span className="material-symbols-outlined text-blue-600 text-xl">smart_toy</span>
                        </div>
                        <div className="flex flex-col gap-1 max-w-[85%]">
                            <span className="text-xs font-bold text-slate-500 ml-1">AI 안전도우미</span>
                            <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white whitespace-pre-line">
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Issues List */}
                {issues.map((issue, idx) => (
                    <div
                        key={issue.id || idx}
                        className="chat-message flex gap-3"
                        style={{ animationDelay: `${0.2 + idx * 0.2}s` }}
                    >
                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 ${issue.ruleId?.startsWith("pattern_") ? "bg-purple-100" : "bg-blue-100"
                            }`}>
                            <span className={`material-symbols-outlined text-xl ${issue.ruleId?.startsWith("pattern_") ? "text-purple-600" : "text-blue-600"
                                }`}>
                                {issue.ruleId?.startsWith("pattern_") ? "query_stats" : "smart_toy"}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 max-w-[85%]">
                            <div
                                className={`bg-white dark:bg-surface-dark p-4 rounded-2xl rounded-tl-none shadow-sm border-l-4 ${severityBorder(
                                    issue.severity, issue.ruleId
                                )} text-slate-800 dark:text-white`}
                            >
                                <h4
                                    className={`font-black text-lg mb-2 flex items-center gap-2 ${severityColor(
                                        issue.severity, issue.ruleId
                                    )}`}
                                >
                                    <span className="material-symbols-outlined">
                                        {severityIcon(issue.severity, issue.ruleId)}
                                    </span>
                                    {issue.title}
                                </h4>

                                <p className="text-[16px] leading-relaxed mb-4 whitespace-pre-line">{issue.message}</p>

                                <div className="grid grid-cols-2 gap-2">
                                    <button className="py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm">
                                        확인했어
                                    </button>
                                    <button className="py-3 bg-primary hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-green-200">
                                        수정해줘
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <div className="h-4" />
            </div>

            <div className="p-6 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        className="flex flex-col items-center justify-center gap-1 p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 font-bold transition-all"
                        onClick={onReupload}
                    >
                        <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                        <span>다시 업로드</span>
                    </button>

                    <button
                        className="flex flex-col items-center justify-center gap-1 p-4 bg-primary hover:bg-green-600 rounded-2xl text-white font-bold shadow-lg shadow-green-200 transition-all"
                        onClick={onModify}
                    >
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                        <span>수정 완료</span>
                    </button>
                </div>

                <div className="relative flex items-center gap-2">
                    <input
                        className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 px-5 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary"
                        placeholder="메시지를 입력하세요..."
                        type="text"
                        disabled
                    />
                    <button className="p-3 bg-yellow-400 text-black rounded-full hover:bg-yellow-500 transition-colors shadow-sm absolute right-1">
                        <span className="material-symbols-outlined block">arrow_upward</span>
                    </button>
                </div>
            </div>
        </div >
    );
}
