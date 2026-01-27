"use client";

import React from "react";

export type Project = {
    id: string;
    name: string;
    description: string;
};

interface WelcomeScreenProps {
    projects: Project[];
    onCreateProject: () => void;
    onSelectProject: (projectId: string) => void;
    onProceedWithoutProject: () => void;
}

export function WelcomeScreen({
    projects,
    onCreateProject,
    onSelectProject,
    onProceedWithoutProject
}: WelcomeScreenProps) {
    return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 p-6">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center size-20 bg-primary rounded-2xl text-white shadow-2xl shadow-primary/30 mb-6">
                        <span className="material-symbols-outlined text-5xl">safety_check</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">
                        스마트 안전지킴이에 오신 것을 환영합니다
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
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
                        disabled={projects.length === 0}
                        className="group bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-green-500 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent"
                    >
                        <div className="flex items-center justify-center size-16 bg-green-500/10 rounded-xl mb-4 group-hover:bg-green-500/20 transition-colors">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            기존 프로젝트 선택
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {projects.length > 0 ? "저장된 프로젝트에서 선택하여 계속하세요" : "아직 생성된 프로젝트가 없습니다"}
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
                {projects.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            최근 프로젝트
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                            {projects.slice(0, 6).map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => onSelectProject(project.id)}
                                    className="text-left p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors group"
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
                                        <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
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
        </div>
    );
}
