
"use client";

import { useState } from "react";

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

// Issue Card Component
function IssueCard({ issue, idx }: { issue: Issue; idx: number }) {
    return (
        <div
            key={issue.id || idx}
            className="chat-message flex gap-3"
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
    );
}

export default function AnalysisPanel({ loading, issues, chatMessages, onReupload, onModify, currentProjectName, riskCalculation }: AnalysisPanelProps) {
    const [showRiskDetails, setShowRiskDetails] = useState(false);
    const reportExists = issues.length > 0 || chatMessages.length > 0;

    // Group issues by stage
    const stage12Issues = issues.filter(i => getIssueStage(i.ruleId) === "stage1-2");
    const stage3StructuredIssues = issues.filter(i => getIssueStage(i.ruleId) === "stage3-structured");
    const stage3RiskIssues = issues.filter(i => getIssueStage(i.ruleId) === "stage3-risk");
    const stage3CrossIssues = issues.filter(i => getIssueStage(i.ruleId) === "stage3-cross");
    const stage4Issues = issues.filter(i => getIssueStage(i.ruleId) === "stage4");

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

                {/* Risk Score Dashboard - Stage 3 */}
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

                                {/* Risk Mismatch Warning */}
                                {riskCalculation.inconsistency && riskCalculation.documentedRisk && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-orange-600 text-xl">warning</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-orange-800 mb-1">위험도 불일치 감지</p>
                                                <p className="text-sm text-orange-700">
                                                    문서 기록: <span className="font-bold">{riskLevelKo[riskCalculation.documentedRisk]}</span> vs
                                                    계산 결과: <span className="font-bold">{riskLevelKo[riskCalculation.calculatedRisk]}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Risk Factors Breakdown */}
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
                                                    <p className="text-xs text-slate-500">{factor.category}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stage 1-2: Format & Logic Validation */}
                {stage12Issues.length > 0 && (
                    <>
                        <div className="flex justify-center">
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                                Stage 1-2: 형식 및 논리 검증
                            </span>
                        </div>
                        {stage12Issues.map((issue, idx) => (
                            <IssueCard key={issue.id || idx} issue={issue} idx={idx} />
                        ))}
                    </>
                )}

                {/* Stage 3: Structured Plan Validation */}
                {stage3StructuredIssues.length > 0 && (
                    <>
                        <div className="flex justify-center">
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                Stage 3: 구조화된 계획 검증
                            </span>
                        </div>
                        {stage3StructuredIssues.map((issue, idx) => (
                            <IssueCard key={issue.id || idx} issue={issue} idx={idx} />
                        ))}
                    </>
                )}

                {/* Stage 3: Risk Analysis */}
                {stage3RiskIssues.length > 0 && (
                    <>
                        <div className="flex justify-center">
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                                Stage 3: 위험도 분석
                            </span>
                        </div>
                        {stage3RiskIssues.map((issue, idx) => (
                            <IssueCard key={issue.id || idx} issue={issue} idx={idx} />
                        ))}
                    </>
                )}

                {/* Stage 3: Cross-Document Analysis */}
                {stage3CrossIssues.length > 0 && (
                    <>
                        <div className="flex justify-center">
                            <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                                Stage 3: 문서 간 분석
                            </span>
                        </div>
                        {stage3CrossIssues.map((issue, idx) => (
                            <IssueCard key={issue.id || idx} issue={issue} idx={idx} />
                        ))}
                    </>
                )}

                {/* Stage 4: Behavioral Patterns */}
                {stage4Issues.length > 0 && (
                    <>
                        <div className="flex justify-center">
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                                Stage 4: 행동 패턴 분석
                            </span>
                        </div>
                        {stage4Issues.map((issue, idx) => (
                            <IssueCard key={issue.id || idx} issue={issue} idx={idx} />
                        ))}
                    </>
                )}

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
