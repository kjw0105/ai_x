"use client";

import { useEffect, useState } from "react";

interface ProjectStats {
    totalDocuments: number;
    averageScore: number | null;
    criticalIssuesCount: number;
    lastActivity: string | null;
    documentTypeBreakdown: Record<string, number>;
    recentTrend: string | null;
    recentScores: number[];
}

interface ProjectStatsCardProps {
    projectId: string;
}

export function ProjectStatsCard({ projectId }: ProjectStatsCardProps) {
    const [stats, setStats] = useState<ProjectStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch(`/api/projects/${projectId}/stats`);
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (e) {
                console.error("Failed to fetch stats:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [projectId]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">analytics</span>
                프로젝트 통계
            </h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Total Documents */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                        총 문서
                    </div>
                    <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
                        {stats.totalDocuments}
                    </div>
                    {stats.recentTrend && (
                        <div className={`text-xs font-medium mt-1 ${parseFloat(stats.recentTrend) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(stats.recentTrend) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(stats.recentTrend))}% (7일)
                        </div>
                    )}
                </div>

                {/* Average Score */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                        평균 점수
                    </div>
                    <div className="text-2xl font-black text-green-900 dark:text-green-100">
                        {stats.averageScore ?? "N/A"}
                    </div>
                    {stats.averageScore && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            / 100
                        </div>
                    )}
                </div>

                {/* Critical Issues */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                        심각한 문제
                    </div>
                    <div className="text-2xl font-black text-red-900 dark:text-red-100">
                        {stats.criticalIssuesCount}
                    </div>
                </div>

                {/* Last Activity */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                        최근 활동
                    </div>
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-100">
                        {stats.lastActivity
                            ? new Date(stats.lastActivity).toLocaleDateString('ko-KR')
                            : "없음"}
                    </div>
                </div>
            </div>

            {/* Document Type Breakdown */}
            {Object.keys(stats.documentTypeBreakdown).length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                        문서 유형별 분포
                    </div>
                    <div className="space-y-2">
                        {Object.entries(stats.documentTypeBreakdown).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700 dark:text-slate-300">{type}</span>
                                <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
