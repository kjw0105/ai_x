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
}

export function ProjectSelector({ projects, currentProjectId, onProjectChange, onOpenNewProject }: ProjectSelectorProps) {

    // Find current project name
    const currentProject = projects.find(p => p.id === currentProjectId);

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
                            <button
                                key={p.id}
                                onClick={() => onProjectChange(p.id)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 group flex justify-between items-center ${currentProjectId === p.id ? 'text-blue-400 bg-gray-700/50' : 'text-gray-300'}`}
                            >
                                <span className="truncate block">
                                    <span className="font-medium block">{p.name}</span>
                                    {p.description && <span className="text-xs text-gray-500 truncate block">{p.description}</span>}
                                </span>
                                {currentProjectId === p.id && (
                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
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
