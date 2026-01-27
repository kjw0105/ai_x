"use client";

import React, { useEffect, useState } from "react";

export type Project = {
    id: string;
    name: string;
    description: string;
};

interface ProjectSelectorProps {
    projects: Project[];
    currentProjectId: string | null;
    onProjectChange: (projectId: string | null) => void;
    onOpenNewProject: () => void;
    onDeleteProject: (projectId: string) => void;
}

export function ProjectSelector({ projects, currentProjectId, onProjectChange, onOpenNewProject, onDeleteProject }: ProjectSelectorProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Find current project name
    const currentProject = projects.find(p => p.id === currentProjectId);

    async function handleDelete(projectId: string, projectName: string, e: React.MouseEvent) {
        e.stopPropagation();

        if (window.confirm(`정말로 "${projectName}" 프로젝트를 삭제하시겠습니까?\n\n연결된 리포트는 보존되지만 프로젝트 컨텍스트와의 연결이 해제됩니다.`)) {
            setDeletingId(projectId);
            try {
                await onDeleteProject(projectId);
            } finally {
                setDeletingId(null);
            }
        }
    }

    return (
        <div className="flex items-center gap-2">
            <div className="relative group">
                <button
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-md border border-slate-200 dark:border-white/10 transition-colors"
                >
                    <span className="text-slate-500 dark:text-gray-400">프로젝트:</span>
                    <span className="text-slate-900 dark:text-white max-w-[150px] truncate">
                        {currentProject ? currentProject.name : "일반 검증 (프로젝트 없음)"}
                    </span>
                    <svg className="w-4 h-4 text-slate-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 hidden group-hover:block hover:block">
                    <div className="max-h-[300px] overflow-y-auto">
                        <button
                            onClick={() => onProjectChange(null)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${!currentProjectId ? 'text-blue-400 bg-gray-700/50' : 'text-gray-300'}`}
                        >
                            일반 검증 (프로젝트 없음)
                        </button>

                        {projects.map(p => (
                            <div
                                key={p.id}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 group flex justify-between items-center ${currentProjectId === p.id ? 'text-blue-400 bg-gray-700/50' : 'text-gray-300'}`}
                            >
                                <button
                                    onClick={() => onProjectChange(p.id)}
                                    className="flex-1 text-left flex items-center gap-2"
                                >
                                    <span className="truncate block flex-1">
                                        <span className="font-medium block">{p.name}</span>
                                        {p.description && <span className="text-xs text-gray-500 truncate block">{p.description}</span>}
                                    </span>
                                    {currentProjectId === p.id && (
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    onClick={(e) => handleDelete(p.id, p.name, e)}
                                    disabled={deletingId === p.id}
                                    className="flex-shrink-0 ml-2 p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                                    title="프로젝트 삭제"
                                >
                                    {deletingId === p.id ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-700 p-2">
                        <button
                            onClick={onOpenNewProject}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 rounded border border-blue-400/20 transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            새 프로젝트 생성
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
