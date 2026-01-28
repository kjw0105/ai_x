"use client";

import { ProjectStatsCard } from "./ProjectStatsCard";

interface ProjectDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
    projectName?: string;
}

export function ProjectDashboard({ isOpen, onClose, projectId, projectName }: ProjectDashboardProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-3xl">dashboard</span>
                            프로젝트 대시보드
                        </h2>
                        {projectName && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {projectName}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                {projectId ? (
                    <div className="space-y-6">
                        <ProjectStatsCard projectId={projectId} />

                        {/* Additional dashboard sections can be added here */}
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
                            더 많은 분석 기능이 곧 추가될 예정입니다
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                            folder_off
                        </span>
                        <p className="text-slate-600 dark:text-slate-400">
                            프로젝트를 선택하면 대시보드를 볼 수 있습니다
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
