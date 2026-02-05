"use client";

import { ProjectStatsCard } from "./ProjectStatsCard";

interface ProjectDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
    projectName?: string;
    onOpenNewProject?: () => void;
}

export function ProjectDashboard({ isOpen, onClose, projectId, projectName, onOpenNewProject }: ProjectDashboardProps) {
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
                        <div className="inline-flex items-center justify-center size-20 bg-slate-100 dark:bg-slate-700/50 rounded-full mb-4">
                            <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500">
                                folder_off
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            선택된 프로젝트가 없습니다
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                            대시보드를 확인하려면 프로젝트를 선택하거나 새로운 프로젝트를 생성하세요.
                        </p>
                        <button
                            onClick={() => {
                                onClose();
                                onOpenNewProject?.();
                            }}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all"
                        >
                            새 프로젝트 만들기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
