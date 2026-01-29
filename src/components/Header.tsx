import { ProjectSelector } from "./ProjectSelector";
import { Breadcrumbs } from "./Breadcrumbs";

interface HeaderProps {
    loading: boolean;
    reportExists: boolean;
    isLoadingProjects: boolean; // Track if projects are being fetched
    onUpload: () => void;
    onStartTBM?: () => void;
    onShowHistory: () => void;
    onShowDashboard?: () => void;
    toggleDark: () => void;
    showWelcome?: boolean; // Hide upload button when welcome screen is visible

    // Project Props
    projects: any[]; // Avoid circular dependency with type import if possible, or import Project type
    currentProjectId: string | null;
    onProjectChange: (id: string | null) => void;
    onOpenNewProject: () => void;
    onDeleteProject: (projectId: string) => void;
    onEditProject?: (project: { id: string; name: string; description: string }) => void;
    onShowWelcome?: () => void;

    // Breadcrumbs Props
    currentFileName?: string;

    // Temp Master Doc Props
    hasTempMasterDoc?: boolean;
    onOpenTempMasterDoc?: () => void;
}

export default function Header({
    loading,
    reportExists,
    isLoadingProjects,
    onUpload,
    onStartTBM,
    onShowHistory,
    onShowDashboard,
    toggleDark,
    showWelcome = false,
    projects,
    currentProjectId,
    onProjectChange,
    onOpenNewProject,
    onDeleteProject,
    onEditProject,
    onShowWelcome,
    currentFileName,
    hasTempMasterDoc,
    onOpenTempMasterDoc
}: HeaderProps) {
    // Build breadcrumbs
    const currentProject = projects.find(p => p.id === currentProjectId);
    const breadcrumbItems = [
        { label: "홈", onClick: onShowWelcome },
        ...(currentProject ? [{
            label: currentProject.name,
            badge: currentProject.contextText && currentProject.contextText.trim().length > 0
                ? { text: "마스터", color: "blue" as const, tooltip: "마스터 안전 계획서 등록됨" }
                : { text: "없음", color: "gray" as const, tooltip: "마스터 안전 계획서 미등록" }
        }] : []),
        ...(currentFileName ? [{ label: currentFileName }] : []),
    ];

    return (
        <header className="flex flex-col border-b border-solid border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark shrink-0 z-20 shadow-sm">
            <div className="flex items-center justify-between whitespace-nowrap px-4 lg:px-6 py-2 lg:py-3">
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={onShowWelcome}
                        disabled={!onShowWelcome}
                        className="flex items-center gap-2 text-slate-800 dark:text-white cursor-pointer rounded-lg px-1.5 py-1 -mx-1.5 -my-1 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:shadow-none"
                        aria-label="Go to welcome screen"
                        title="Go to welcome screen"
                    >
                        <div className="size-9 lg:size-10 flex items-center justify-center bg-primary rounded-lg text-white shadow-md shadow-primary/20">
                            <span className="material-symbols-outlined text-2xl">safety_check</span>
                        </div>
                        <div>
                            <h2 className="text-lg lg:text-xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                                스마트 안전지킴이
                            </h2>
                            <p className="text-[10px] lg:text-xs text-slate-500 font-bold">경상남도 중소기업 지원 시스템</p>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <ProjectSelector
                        projects={projects}
                        currentProjectId={currentProjectId}
                        isLoadingProjects={isLoadingProjects}
                        onProjectChange={onProjectChange}
                        onOpenNewProject={onOpenNewProject}
                        onDeleteProject={onDeleteProject}
                        onEditProject={onEditProject}
                        onShowWelcome={onShowWelcome}
                    />

                    <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2">
                        <span
                            className={`size-2 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : reportExists ? "bg-green-500" : "bg-slate-400"
                                }`}
                        />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-200" suppressHydrationWarning>
                            {loading ? "AI 분석 중" : reportExists ? "AI 분석 완료" : "대기 중"}
                        </span>
                    </div>

                    {onShowDashboard && currentProjectId && (
                    <button
                        onClick={onShowDashboard}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-bold"
                        aria-label="프로젝트 대시보드 열기"
                        title="프로젝트 대시보드"
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                    </button>
                    )}



                <button
                    onClick={onShowHistory}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-bold"
                    aria-label="기록 보기"
                    title="기록 보기"
                >
                    <span className="material-symbols-outlined">history</span>
                </button>

                <button
                    onClick={toggleDark}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-bold"
                    aria-label="다크모드 토글"
                    title="다크모드 토글"
                >
                    <span className="material-symbols-outlined">dark_mode</span>
                </button>

                    {/* Hide action buttons when welcome screen is visible */}
                    {!showWelcome && (
                        <>
                            {onStartTBM && (
                                <button
                                    onClick={onStartTBM}
                                    disabled={isLoadingProjects}
                                    className={`px-4 py-2 rounded-xl font-black border shadow-sm inline-flex items-center gap-2 transition-colors ${
                                        isLoadingProjects
                                            ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 cursor-not-allowed opacity-60'
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                    title={isLoadingProjects ? "프로젝트 로딩 중..." : "TBM(작업 전 대화) 녹음"}
                                >
                                    <span className="material-symbols-outlined">mic</span>
                                    TBM 시작
                                </button>
                            )}

                            {/* Temp Master Doc Button - Show only when no project selected */}
                            {!currentProjectId && onOpenTempMasterDoc && (
                                <button
                                    onClick={onOpenTempMasterDoc}
                                    disabled={isLoadingProjects}
                                    className={`px-4 py-2 rounded-xl font-black border shadow-sm inline-flex items-center gap-2 transition-colors ${
                                        hasTempMasterDoc
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    } ${isLoadingProjects ? 'cursor-not-allowed opacity-60' : ''}`}
                                    title={hasTempMasterDoc ? "임시 마스터 문서 활성화됨" : "임시 마스터 문서 업로드"}
                                >
                                    <span className="material-symbols-outlined">{hasTempMasterDoc ? 'check_circle' : 'description'}</span>
                                    임시 마스터
                                </button>
                            )}

                            <button
                                onClick={onUpload}
                                disabled={isLoadingProjects}
                                className={`px-4 py-2 rounded-xl font-black shadow-lg inline-flex items-center gap-2 transition-colors ${
                                    isLoadingProjects
                                        ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 shadow-slate-200 cursor-not-allowed opacity-60'
                                        : 'bg-primary text-white shadow-green-200 hover:bg-green-600'
                                }`}
                                title={isLoadingProjects ? "프로젝트 로딩 중..." : "파일 업로드"}
                            >
                                <span className="material-symbols-outlined">upload</span>
                                파일 업로드
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Breadcrumbs - Only show when not on welcome screen and has multiple items */}
            {!showWelcome && breadcrumbItems.length > 1 && (
                <div className="px-6 pb-3">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
            )}
        </header>
    );
}
