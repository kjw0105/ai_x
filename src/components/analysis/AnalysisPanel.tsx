
"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";

// Stage detection helper
function getIssueStage(ruleId?: string): string {
    if (!ruleId) return "stage1-2";
    if (ruleId.startsWith("pattern_")) return "stage4";
    if (ruleId.startsWith("cross_doc_")) return "stage3-cross";
    if (ruleId.startsWith("risk_matrix_")) return "stage3-risk";
    if (ruleId.startsWith("structured_")) return "stage3-structured";
    return "stage1-2";
}

function severityBorder(sev: string, ruleId?: string) {
    const stage = getIssueStage(ruleId);
    // Stage 3 systems get distinct styling
    if (stage === "stage3-structured") return "border-l-blue-500";
    if (stage === "stage3-risk") return "border-l-purple-500";
    if (stage === "stage3-cross") return "border-l-cyan-500";
    // Stage 4: Pattern warnings
    if (stage === "stage4") return "border-l-purple-500";
    // Stage 1-2: Traditional
    if (sev === "error") return "border-l-red-500";
    if (sev === "warn") return "border-l-orange-500";
    return "border-l-slate-400";
}

function severityColor(sev: string, ruleId?: string) {
    const stage = getIssueStage(ruleId);
    if (stage === "stage3-structured") return "text-blue-600";
    if (stage === "stage3-risk") return "text-purple-600";
    if (stage === "stage3-cross") return "text-cyan-600";
    if (stage === "stage4") return "text-purple-600";
    if (sev === "error") return "text-red-600";
    if (sev === "warn") return "text-orange-600";
    return "text-slate-600";
}

function severityIcon(sev: string, ruleId?: string) {
    const stage = getIssueStage(ruleId);
    if (stage === "stage3-structured") return "verified_user";
    if (stage === "stage3-risk") return "analytics";
    if (stage === "stage3-cross") return "timeline";
    if (stage === "stage4") return "query_stats";
    if (sev === "error") return "edit_off";
    if (sev === "warn") return "warning";
    return "info";
}

function avatarBgColor(ruleId?: string) {
    const stage = getIssueStage(ruleId);
    if (stage === "stage3-structured") return "bg-blue-100";
    if (stage === "stage3-risk") return "bg-purple-100";
    if (stage === "stage3-cross") return "bg-cyan-100";
    if (stage === "stage4") return "bg-purple-100";
    return "bg-blue-100";
}

function avatarColor(ruleId?: string) {
    const stage = getIssueStage(ruleId);
    if (stage === "stage3-structured") return "text-blue-600";
    if (stage === "stage3-risk") return "text-purple-600";
    if (stage === "stage3-cross") return "text-cyan-600";
    if (stage === "stage4") return "text-purple-600";
    return "text-blue-600";
}

interface Issue {
    id: string;
    severity: "error" | "warn" | "info";
    title: string;
    message: string;
    ruleId?: string; // Stage 2-5: Link to specific rule
    confidence?: number; // Stage 4
    score?: number; // Stage 4
    isAIFixable?: boolean; // Whether AI can suggest a fix (false for signatures, photos, physical inspections)
}

interface RiskFactor {
    category: string;
    description: string;
    impact: number;
    severity: "low" | "medium" | "high" | "critical";
}

interface RiskCalculation {
    calculatedRisk: "low" | "medium" | "high" | "critical";
    documentedRisk: "low" | "medium" | "high" | "critical" | null;
    riskScore: number;
    factors: RiskFactor[];
    inconsistency: boolean;
    recommendation?: string;
}

interface AnalysisPanelProps {
    loading: boolean;
    issues: Issue[];
    chatMessages: { role: "ai" | "user"; text: string }[];
    onReupload: () => void;
    onModify: () => void;
    currentProjectName?: string;
    riskCalculation?: RiskCalculation; // Stage 3: Risk matrix data
}

export default function AnalysisPanel({ loading, issues, chatMessages, onReupload, onModify, currentProjectName, riskCalculation, currentFile }: AnalysisPanelProps & { currentFile?: File | null }) {
    const [hiddenIssueIds, setHiddenIssueIds] = useState<Set<string>>(new Set());
    const [processingIssueId, setProcessingIssueId] = useState<string | null>(null);
    const [showRiskDetails, setShowRiskDetails] = useState(false);
    const [severityFilters, setSeverityFilters] = useState<Set<string>>(new Set(["error", "warn", "info"]));
    const toast = useToast();

    // Suggestion Modal State
    const [suggestion, setSuggestion] = useState<{ title: string; text: string } | null>(null);

    const reportExists = issues.length > 0 || chatMessages.length > 0;

    // Filter hidden issues and by severity
    const visibleIssues = issues.filter(i =>
        !hiddenIssueIds.has(i.id) && severityFilters.has(i.severity)
    );

    const toggleSeverityFilter = (severity: string) => {
        setSeverityFilters(prev => {
            const next = new Set(prev);
            if (next.has(severity)) {
                next.delete(severity);
            } else {
                next.add(severity);
            }
            return next;
        });
    };

    // Count issues by severity
    const errorCount = issues.filter(i => i.severity === "error").length;
    const warnCount = issues.filter(i => i.severity === "warn").length;
    const infoCount = issues.filter(i => i.severity === "info").length;

    const handleConfirm = (id: string) => {
        setHiddenIssueIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const handleFix = async (issue: Issue) => {
        setProcessingIssueId(issue.id);
        try {
            let pdfText = "";
            let fileData = null;
            let fileType = "";

            if (currentFile) {
                fileType = currentFile.type;
                if (fileType === "application/pdf") {
                    fileData = await currentFile.arrayBuffer();
                    // We need to send base64 or similar if we want to process it server side in this simple setup
                    // For now let's just ask for text suggestion to keep it light unless we implement full upload
                }
            }

            const res = await fetch("/api/fix", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    issue,
                    fileType: "image/png", // forcing text suggestion for now to avoid massive payload issues
                    pdfText: ""
                })
            });

            // CRITICAL FIX: Check response status before parsing JSON
            if (!res.ok) {
                // Try to parse error message from response
                let errorMessage = "AI 수정 제안 생성에 실패했습니다";
                let isAdminError = false;

                try {
                    const errorData = await res.json();
                    if (errorData.error) {
                        // Check if it's an admin/system error (API key, config issues)
                        if (errorData.error.includes("API Key") ||
                            errorData.error.includes("API_KEY") ||
                            errorData.error.includes("configuration") ||
                            errorData.solution) {
                            isAdminError = true;
                            console.error("Admin/System error:", errorData.error);
                            // Show generic message to user, log details for admin
                            errorMessage = "일시적으로 AI 수정 제안 기능을 사용할 수 없습니다";
                        } else {
                            errorMessage = errorData.error;
                        }
                    }
                } catch {
                    // If JSON parsing fails, check status code
                    if (res.status === 500 || res.status === 503) {
                        errorMessage = "일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요";
                    } else {
                        errorMessage = `서버 오류: ${res.status}`;
                    }
                }

                toast.error(errorMessage);
                if (!isAdminError) {
                    console.error("Fix API error:", errorMessage);
                }
                return;
            }

            const data = await res.json();

            if (data.error) {
                toast.error(`AI 수정 제안 실패: ${data.error}`);
                return;
            }

            if (data.suggestion) {
                setSuggestion({ title: "AI 추천 수정안", text: data.suggestion });
                toast.success("AI 수정 제안이 생성되었습니다");
            } else {
                toast.warning("수정 제안을 생성할 수 없습니다");
            }
        } catch (e: any) {
            console.error("handleFix error:", e);
            const errorMsg = e.message || "AI 수정 제안 시스템 오류가 발생했습니다";
            toast.error(errorMsg);
        } finally {
            setProcessingIssueId(null);
        }
    };

    // Group visible issues by stage
    const stage12Issues = visibleIssues.filter(i => getIssueStage(i.ruleId) === "stage1-2");
    const stage3StructuredIssues = visibleIssues.filter(i => getIssueStage(i.ruleId) === "stage3-structured");
    const stage3RiskIssues = visibleIssues.filter(i => getIssueStage(i.ruleId) === "stage3-risk");
    const stage3CrossIssues = visibleIssues.filter(i => getIssueStage(i.ruleId) === "stage3-cross");
    const stage4Issues = visibleIssues.filter(i => getIssueStage(i.ruleId) === "stage4");

    // ... (Keep existing helpers and render logic, but pass handle functions to IssueCard)

    // Default welcome message if no chat
    const messages = chatMessages.length > 0 ? chatMessages : [
        { role: "ai", text: "안녕하세요! 👋\n서류를 올려주시면 빠진 항목/불일치/수정사항을 찾아드릴게요." }
    ];

    // Risk level Korean translation
    const riskLevelKo: Record<string, string> = {
        low: "낮음",
        medium: "보통",
        high: "높음",
        critical: "매우 높음"
    };

    // Risk level colors
    const riskLevelColor: Record<string, string> = {
        low: "bg-green-100 text-green-700 border-green-300",
        medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
        high: "bg-orange-100 text-orange-700 border-orange-300",
        critical: "bg-red-100 text-red-700 border-red-300"
    };

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
                                <span className="inline-flex items-center rounded-md bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-bold text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 border border-blue-200 dark:border-blue-800">
                                    <span className="material-symbols-outlined text-[16px] mr-1">business</span>
                                    {currentProjectName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Severity Filter - Only show when there are issues */}
                {reportExists && issues.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">필터:</span>
                        <button
                            onClick={() => toggleSeverityFilter("error")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                severityFilters.has("error")
                                    ? "bg-red-100 text-red-700 border-2 border-red-300 dark:bg-red-900/30 dark:text-red-300"
                                    : "bg-slate-100 text-slate-400 border-2 border-slate-200 dark:bg-slate-700 dark:text-slate-500"
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">error</span>
                            <span>심각 ({errorCount})</span>
                        </button>
                        <button
                            onClick={() => toggleSeverityFilter("warn")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                severityFilters.has("warn")
                                    ? "bg-orange-100 text-orange-700 border-2 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300"
                                    : "bg-slate-100 text-slate-400 border-2 border-slate-200 dark:bg-slate-700 dark:text-slate-500"
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">warning</span>
                            <span>경고 ({warnCount})</span>
                        </button>
                        <button
                            onClick={() => toggleSeverityFilter("info")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                severityFilters.has("info")
                                    ? "bg-blue-100 text-blue-700 border-2 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300"
                                    : "bg-slate-100 text-slate-400 border-2 border-slate-200 dark:bg-slate-700 dark:text-slate-500"
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">info</span>
                            <span>정보 ({infoCount})</span>
                        </button>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                            {visibleIssues.length} / {issues.length} 표시중
                        </span>
                    </div>
                )}
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

                {/* Risk Dashboard */}
                {riskCalculation && (
                    <div className="chat-message flex gap-3">
                        <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                            <span className="material-symbols-outlined text-purple-600 text-xl">analytics</span>
                        </div>
                        <div className="flex flex-col gap-1 w-full max-w-[85%]">
                            <span className="text-xs font-bold text-slate-500 ml-1">위험도 평가 시스템</span>
                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-600 mb-1">객관적 위험도 점수</h3>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-slate-800 dark:text-white">{riskCalculation.riskScore}</span>
                                            <span className="text-sm text-slate-500">/100</span>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full border-2 font-bold text-sm ${riskLevelColor[riskCalculation.calculatedRisk]}`}>
                                        {riskLevelKo[riskCalculation.calculatedRisk]}
                                    </div>
                                </div>

                                {/* Risk Factors */}
                                <button
                                    onClick={() => setShowRiskDetails(!showRiskDetails)}
                                    className="w-full flex items-center justify-between text-sm font-bold text-slate-600 hover:text-slate-800 py-2 border-t border-slate-200"
                                >
                                    <span>위험 요인 상세 ({riskCalculation.factors.length}개)</span>
                                    <span className="material-symbols-outlined text-lg">
                                        {showRiskDetails ? "expand_less" : "expand_more"}
                                    </span>
                                </button>

                                {showRiskDetails && (
                                    <div className="mt-3 space-y-2">
                                        {riskCalculation.factors.map((factor, idx) => (
                                            <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                                                <div className={`mt-1 size-2 rounded-full ${factor.severity === "critical" ? "bg-red-500" :
                                                    factor.severity === "high" ? "bg-orange-500" :
                                                        factor.severity === "medium" ? "bg-yellow-500" : "bg-green-500"
                                                    }`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium text-slate-700">{factor.description}</p>
                                                        <span className="text-xs font-bold text-slate-500 ml-2">+{factor.impact}점</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Render Issues by Stage */}
                {[
                    { title: "Stage 1-2: 형식 및 논리 검증", issues: stage12Issues, color: "text-red-500 bg-red-50 border-red-200" },
                    { title: "Stage 3: 구조화된 계획 검증", issues: stage3StructuredIssues, color: "text-blue-600 bg-blue-50 border-blue-200" },
                    { title: "Stage 3: 위험도 분석", issues: stage3RiskIssues, color: "text-purple-600 bg-purple-50 border-purple-200" },
                    { title: "Stage 3: 문서 간 분석", issues: stage3CrossIssues, color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
                    { title: "Stage 4: 행동 패턴 분석", issues: stage4Issues, color: "text-purple-600 bg-purple-50 border-purple-200" },
                ].map((group, idx) => (
                    group.issues.length > 0 && (
                        <div key={idx}>
                            <div className="flex justify-center mb-4">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${group.color}`}>
                                    {group.title}
                                </span>
                            </div>
                            {group.issues.map((issue, i) => (
                                <IssueCard
                                    key={issue.id}
                                    issue={issue}
                                    idx={i}
                                    onConfirm={() => handleConfirm(issue.id)}
                                    onFix={() => handleFix(issue)}
                                    isProcessing={processingIssueId === issue.id}
                                />
                            ))}
                        </div>
                    )
                ))}

                <div className="h-4" />
            </div>

            {/* Input Area */}
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
                        placeholder="메시지를 입력하세요 (준비중)..."
                        type="text"
                        disabled
                    />
                    <button className="p-3 bg-yellow-400 text-black rounded-full hover:bg-yellow-500 transition-colors shadow-sm absolute right-1">
                        <span className="material-symbols-outlined block">arrow_upward</span>
                    </button>
                </div>
            </div>

            {/* Suggestion Modal */}
            {suggestion && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">{suggestion.title}</h3>
                        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl font-mono text-sm overflow-auto max-h-[300px] mb-4 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {suggestion.text}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(suggestion.text);
                                        toast.success("클립보드에 복사되었습니다");
                                    } catch (err) {
                                        console.error("Copy failed:", err);
                                        toast.error("복사에 실패했습니다");
                                    }
                                }}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-800 dark:text-white font-bold transition-colors"
                            >
                                복사하기
                            </button>
                            <button
                                onClick={() => setSuggestion(null)}
                                className="px-4 py-2 bg-primary hover:bg-green-600 text-white rounded-lg font-bold transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

// Updated IssueCard to accept handlers
function IssueCard({ issue, idx, onConfirm, onFix, isProcessing }: { issue: Issue; idx: number; onConfirm: () => void; onFix: () => void; isProcessing: boolean }) {
    const safeId = issue.id || `issue-${idx}`;
    // Check if this issue requires human intervention (signatures, photos, etc.)
    const isHumanOnly = issue.isAIFixable === false;

    return (
        <div
            key={safeId}
            className="chat-message flex gap-3 mb-4"
            style={{ animationDelay: `${0.2 + idx * 0.2}s` }}
        >
            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 ${avatarBgColor(issue.ruleId)}`}>
                <span className={`material-symbols-outlined text-xl ${avatarColor(issue.ruleId)}`}>
                    {severityIcon(issue.severity, issue.ruleId)}
                </span>
            </div>

            <div className="flex flex-col gap-1 max-w-[85%]">
                <div
                    className={`bg-white dark:bg-surface-dark p-4 rounded-2xl rounded-tl-none shadow-sm border-l-4 ${severityBorder(
                        issue.severity, issue.ruleId
                    )} text-slate-800 dark:text-white`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h4
                            className={`font-black text-lg flex items-center gap-2 ${severityColor(
                                issue.severity, issue.ruleId
                            )}`}
                        >
                            <span className="material-symbols-outlined">
                                {severityIcon(issue.severity, issue.ruleId)}
                            </span>
                            {issue.title}
                        </h4>

                        {issue.confidence !== undefined && (
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full text-slate-500">
                                신뢰도 {issue.confidence}%
                            </span>
                        )}
                    </div>

                    <p className="text-[16px] leading-relaxed mb-4 whitespace-pre-line">{issue.message}</p>

                    {/* Show different actions based on whether AI can fix this */}
                    {isHumanOnly ? (
                        // Human-only issue: Show only confirm button with explanation
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg">
                                    person
                                </span>
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                    이 문제는 담당자가 직접 수정해야 합니다 (서명, 사진 촬영 등)
                                </p>
                            </div>
                            <button
                                onClick={onConfirm}
                                className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
                            >
                                확인했어
                            </button>
                        </div>
                    ) : (
                        // AI-fixable issue: Show both confirm and fix buttons
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={onConfirm}
                                className="py-3 bg-white border border-slate-300 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
                            >
                                확인했어
                            </button>
                            <button
                                onClick={onFix}
                                disabled={isProcessing}
                                className="py-3 bg-primary hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="animate-spin material-symbols-outlined text-sm">refresh</span>
                                        생성 중...
                                    </>
                                ) : (
                                    "수정해줘"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
