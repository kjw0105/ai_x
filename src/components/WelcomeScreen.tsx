"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";

export type Project = {
    id: string;
    name: string;
    description: string;
};

interface WelcomeScreenProps {
    projects: Project[];
    isLoadingProjects: boolean;
    onCreateProject: () => void;
    onSelectProject: (projectId: string) => void;
    onProceedWithoutProject: () => void;
    onDeleteProject: (projectId: string) => void;
}

export function WelcomeScreen({
    projects,
    isLoadingProjects,
    onCreateProject,
    onSelectProject,
    onProceedWithoutProject,
    onDeleteProject
}: WelcomeScreenProps) {
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const handleDeleteClick = (projectId: string, projectName: string, description: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent project selection
        setProjectToDelete({ id: projectId, name: projectName, description });
    };

    const confirmDelete = async () => {
        if (!projectToDelete) return;

        setDeletingProjectId(projectToDelete.id);
        try {
            await onDeleteProject(projectToDelete.id);
        } finally {
            setDeletingProjectId(null);
            setProjectToDelete(null);
        }
    };

    const cancelDelete = () => {
        setProjectToDelete(null);
    };
    return (
        <div className="flex-1 flex items-start sm:items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 p-6 overflow-y-auto">
            <div className="max-w-4xl w-full my-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center size-20 bg-primary rounded-2xl text-white shadow-2xl shadow-primary/30 mb-6">
                        <span className="material-symbols-outlined text-5xl">safety_check</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3" suppressHydrationWarning>
                        스마트 안전지킴이에 오신 것을 환영합니다
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300" suppressHydrationWarning>
                        안전 점검 문서를 검증하려면 프로젝트를 선택하거나 새로 만드세요
                    </p>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Create New Project */}
                    <button
                        onClick={onCreateProject}
                        className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-blue-500 transition-all duration-300 text-left"
                    >
                        <div className="flex items-center justify-center size-16 bg-blue-500/10 rounded-xl mb-4 group-hover:bg-blue-500/20 transition-colors">
                            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            새 프로젝트 생성
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            현장별 안전 계획서를 업로드하고 프로젝트 컨텍스트를 설정하세요
                        </p>
                    </button>

                    {/* Select Existing Project */}
                    <button
                        onClick={projects.length > 0 ? undefined : onProceedWithoutProject}
                        disabled={isLoadingProjects || projects.length === 0}
                        className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-green-500 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent"
                    >
                        <div className="flex items-center justify-center size-16 bg-green-500/10 rounded-xl mb-4 group-hover:bg-green-500/20 transition-colors">
                            {isLoadingProjects ? (
                                <svg className="w-8 h-8 text-green-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            기존 프로젝트 선택
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {isLoadingProjects ? "프로젝트 로딩 중..." : projects.length > 0 ? "저장된 프로젝트에서 선택하여 계속하세요" : "아직 생성된 프로젝트가 없습니다"}
                        </p>
                    </button>

                    {/* Proceed Without Project */}
                    <button
                        onClick={onProceedWithoutProject}
                        className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-slate-400 transition-all duration-300 text-left"
                    >
                        <div className="flex items-center justify-center size-16 bg-slate-500/10 rounded-xl mb-4 group-hover:bg-slate-500/20 transition-colors">
                            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            프로젝트 없이 진행
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            일반 검증 모드로 문서를 바로 검증하세요
                        </p>
                    </button>
                </div>

                {/* Existing Projects List */}
                {(isLoadingProjects || projects.length > 0) && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            {isLoadingProjects ? '프로젝트 로딩 중...' : '최근 프로젝트'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                            {/* Skeleton Loaders */}
                            {isLoadingProjects && (
                                <>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 animate-pulse">
                                            <div className="h-5 bg-slate-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {/* Actual Project List - Show first 6 projects */}
                            {!isLoadingProjects && projects.slice(0, 6).map(project => (
                                <div
                                    key={project.id}
                                    className="relative text-left rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors group overflow-hidden"
                                >
                                    <button
                                        onClick={() => onSelectProject(project.id)}
                                        className="w-full text-left p-4 pr-20"
                                        disabled={deletingProjectId === project.id}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                                                    {project.name}
                                                </h4>
                                                {project.description && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                                                        {project.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Action Buttons Container - Right Side */}
                                    <div className="absolute top-0 right-0 h-full flex items-center gap-1 pr-2">
                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => handleDeleteClick(project.id, project.name, project.description, e)}
                                            disabled={deletingProjectId === project.id}
                                            className="p-2 rounded-lg bg-slate-200/50 dark:bg-slate-600/50 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                            title="프로젝트 삭제"
                                        >
                                            {deletingProjectId === project.id ? (
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

                                        {/* Arrow Icon - Always visible */}
                                        <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {projects.length > 6 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                                +{projects.length - 6}개의 프로젝트가 더 있습니다
                            </p>
                        )}
                    </div>
                )}

                {/* Footer Note */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        프로젝트는 언제든지 헤더의 드롭다운 메뉴에서 전환할 수 있습니다
                    </p>
                </div>
            </div>
            {/* Confirmation Modal - Using Portal */}
            {projectToDelete && typeof window !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={cancelDelete}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">프로젝트 삭제</h3>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 mb-2">
                            정말로 <span className="font-bold text-slate-900 dark:text-white">&quot;{projectToDelete.name}&quot;</span> 프로젝트를 삭제하시겠습니까?
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            연결된 리포트는 보존되지만 프로젝트 컨텍스트와의 연결이 해제됩니다.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-800 dark:text-white font-bold transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deletingProjectId === projectToDelete.id}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {deletingProjectId === projectToDelete.id ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        삭제 중...
                                    </>
                                ) : (
                                    "삭제"
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
