"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/contexts/ToastContext";

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
    onEditProject?: (project: { id: string; name: string; description: string }) => void;
    onShowWelcome?: () => void;
}

export function ProjectSelector({ projects, currentProjectId, onProjectChange, onOpenNewProject, onDeleteProject, onEditProject, onShowWelcome }: ProjectSelectorProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const previouslyOpenRef = useRef(false);
    const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
    const toast = useToast();

    // Find current project name
    const currentProject = projects.find(p => p.id === currentProjectId);
    const listboxId = useId();
    const selectionOptions = useMemo(
        () => [
            { id: null, name: "일반 검증 (프로젝트 없음)", description: "" },
            ...projects.map(project => ({ id: project.id, name: project.name, description: project.description || "" })),
        ],
        [projects]
    );

    const getInitialIndex = () => {
        if (!currentProjectId) {
            return 0;
        }
        const projectIndex = projects.findIndex(project => project.id === currentProjectId);
        return projectIndex >= 0 ? projectIndex + 1 : 0;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-project-selector]')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const activeOption = optionRefs.current[activeIndex];
        if (activeOption) {
            activeOption.focus();
        }
    }, [activeIndex, isOpen]);

    useEffect(() => {
        if (!isOpen && previouslyOpenRef.current) {
            requestAnimationFrame(() => triggerRef.current?.focus());
        }
        previouslyOpenRef.current = isOpen;
    }, [isOpen]);

    function handleDelete(projectId: string, projectName: string, e: React.MouseEvent) {
        e.stopPropagation();
        setProjectToDelete({ id: projectId, name: projectName });
    }

    async function confirmDelete() {
        if (!projectToDelete) return;

        setDeletingId(projectToDelete.id);
        try {
            await onDeleteProject(projectToDelete.id);
            toast.success(`"${projectToDelete.name}" 프로젝트가 삭제되었습니다`);
        } catch (error) {
            console.error("Failed to delete project:", error);
            toast.error("프로젝트 삭제에 실패했습니다");
        } finally {
            setDeletingId(null);
            setProjectToDelete(null);
        }
    }

    const handleSelectProject = (projectId: string | null) => {
        onProjectChange(projectId);
        setIsOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
    };

    const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
            event.preventDefault();
            const nextIndex = getInitialIndex();
            setActiveIndex(nextIndex);
            setIsOpen(true);
        }
    };

    const handleListboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
            requestAnimationFrame(() => triggerRef.current?.focus());
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex(prevIndex => (prevIndex + 1) % selectionOptions.length);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(prevIndex => (prevIndex - 1 + selectionOptions.length) % selectionOptions.length);
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const activeOption = selectionOptions[activeIndex];
            if (activeOption) {
                handleSelectProject(activeOption.id);
            }
        }
    };
    function cancelDelete() {
        setProjectToDelete(null);
    }

    return (
        <div className="flex items-center gap-2" data-project-selector>
            <div className="relative">
                <button
                    ref={triggerRef}
                    onClick={() => {
                        setIsOpen(prevOpen => {
                            const nextOpen = !prevOpen;
                            if (nextOpen) {
                                setActiveIndex(getInitialIndex());
                            }
                            return nextOpen;
                        });
                    }}
                    onKeyDown={handleTriggerKeyDown}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-md border border-slate-200 dark:border-white/10 transition-colors"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={listboxId}
                >
                    <span className="text-slate-500 dark:text-gray-400">프로젝트:</span>
                    <span className="text-slate-900 dark:text-white max-w-[150px] truncate">
                        {currentProject ? currentProject.name : "일반 검증 (프로젝트 없음)"}
                    </span>
                    <svg
                        className={`w-4 h-4 text-slate-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                    <div
                        id={listboxId}
                        role="listbox"
                        aria-label="프로젝트 선택"
                        className="max-h-[300px] overflow-y-auto"
                        onKeyDown={handleListboxKeyDown}
                    >
                        <button
                            ref={el => { optionRefs.current[0] = el; }}
                            role="option"
                            aria-selected={!currentProjectId}
                            tabIndex={activeIndex === 0 ? 0 : -1}
                            onClick={() => handleSelectProject(null)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${!currentProjectId ? 'text-blue-400 bg-gray-700/50' : 'text-gray-300'} ${activeIndex === 0 ? 'bg-gray-700/70' : ''}`}
                        >
                            일반 검증 (프로젝트 없음)
                        </button>

                        {projects.map((p, index) => {
                            const optionIndex = index + 1;
                            const isActive = activeIndex === optionIndex;
                            return (
                                <div
                                    key={p.id}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 group flex justify-between items-center ${currentProjectId === p.id ? 'text-blue-400 bg-gray-700/50' : 'text-gray-300'} ${isActive ? 'bg-gray-700/70' : ''}`}
                                >
                                    <button
                                        ref={el => { optionRefs.current[optionIndex] = el; }}
                                        role="option"
                                        aria-selected={currentProjectId === p.id}
                                        tabIndex={isActive ? 0 : -1}
                                        onClick={() => handleSelectProject(p.id)}
                                        className="flex-1 text-left flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
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
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                        {onEditProject && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditProject(p);
                                                }}
                                                className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                                title="프로젝트 수정"
                                                tabIndex={-1}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(p.id, p.name, e)}
                                            disabled={deletingId === p.id}
                                            className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                                            title="프로젝트 삭제"
                                            tabIndex={-1}
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
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-gray-700 p-2 space-y-2">
                        {onShowWelcome && (
                            <button
                                onClick={() => {
                                    onShowWelcome();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-400/10 hover:bg-slate-400/20 rounded border border-slate-400/20 transition-colors"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                홈으로 돌아가기
                            </button>
                        )}
                        <button
                            onClick={() => {
                                onOpenNewProject();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 rounded border border-blue-400/20 transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            새 프로젝트 생성
                        </button>
                    </div>
                </div>
                )}
            </div>

            {/* Confirmation Modal - Using Portal */}
            {projectToDelete && typeof window !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={cancelDelete}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md"
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
                            정말로 <span className="font-bold text-slate-900 dark:text-white">"{projectToDelete.name}"</span> 프로젝트를 삭제하시겠습니까?
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
                                disabled={deletingId === projectToDelete.id}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {deletingId === projectToDelete.id ? (
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
