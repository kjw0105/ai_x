    "use client";

    import { ProjectSelector } from "./ProjectSelector";
    import { Breadcrumbs } from "./Breadcrumbs";
    import { useState, useRef, useEffect } from "react";
    import { useToast } from "@/contexts/ToastContext";

    interface HeaderProps {
        loading: boolean;
        reportExists: boolean;
        isLoadingProjects: boolean; // Track if projects are being fetched
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
        onStartTBM?: () => void;
        onUpload: (e?: React.MouseEvent) => void;
        
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
        onOpenTempMasterDoc,
        onStartTBM,
        onUpload
    }: HeaderProps) {
        const [menuOpen, setMenuOpen] = useState(false);
        const menuRef = useRef<HTMLDivElement>(null);
        const toast = useToast();

        // Close menu when clicking outside
        useEffect(() => {
            function handleClickOutside(event: MouseEvent) {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setMenuOpen(false);
                }
            }
            if (menuOpen) {
                document.addEventListener("mousedown", handleClickOutside);
                return () => document.removeEventListener("mousedown", handleClickOutside);
            }
        }, [menuOpen]);

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
                <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 lg:py-3 gap-2 flex-wrap">
                    <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onShowWelcome}
                            disabled={!onShowWelcome}
                            className="flex items-center gap-1.5 sm:gap-2 text-slate-800 dark:text-white cursor-pointer rounded-lg px-1 sm:px-1.5 py-1 -mx-1 sm:-mx-1.5 -my-1 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:shadow-none"
                            aria-label="Go to welcome screen"
                            title="Go to welcome screen"
                        >
                            <div className="size-8 sm:size-9 lg:size-10 flex items-center justify-center bg-primary rounded-lg text-white shadow-md shadow-primary/20">
                                <span className="material-symbols-outlined text-xl sm:text-2xl">safety_check</span>
                            </div>
                            <div className="hidden sm:block">
                                <h2 className="text-base sm:text-lg lg:text-xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                                    스마트 안전지킴이
                                </h2>
                                <p className="text-[10px] lg:text-xs text-slate-500 font-bold">경상남도 중소기업 지원 시스템</p>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-wrap justify-end flex-1">
                        <div title="프로젝트 선택 - 관련 안전 문서를 그룹으로 관리하세요">
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
                        </div>

                        <div
                            className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2"
                            title={loading ? "문서를 분석하고 있습니다" : reportExists ? "분석이 완료되었습니다" : "문서를 업로드하면 분석이 시작됩니다"}
                        >
                            <span
                                className={`size-2 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : reportExists ? "bg-green-500" : "bg-slate-400"
                                    }`}
                            />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-200" suppressHydrationWarning>
                                {loading ? "AI 분석 중" : reportExists ? "AI 분석 완료" : "대기 중"}
                            </span>
                        </div>

                        {/* Overflow Menu */}
                        {/* Overflow Menu */}
<div className="relative" ref={menuRef}>
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-bold transition-colors"
    aria-label="더보기 메뉴"
    title="더보기 메뉴 - 기록, 대시보드, 설정"
  >
    <span className="material-symbols-outlined text-lg sm:text-xl">more_vert</span>
  </button>

  {/* Dropdown Menu */}
  {menuOpen && (
    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <button
        onClick={() => {
          onShowHistory();
          setMenuOpen(false);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200 transition-colors"
      >
        <span className="material-symbols-outlined text-xl">history</span>
        <div>
          <div className="font-bold text-sm">기록 보기</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">과거 검증 결과</div>
        </div>
      </button>

      {onShowDashboard && currentProjectId && (
        <button
          onClick={() => {
            onShowDashboard();
            setMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <div>
            <div className="font-bold text-sm">프로젝트 대시보드</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">통계 및 인사이트</div>
          </div>
        </button>
      )}

      <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>

      <button
        onClick={() => {
          localStorage.removeItem("skip_document_type_selector");
          setMenuOpen(false);
          toast?.success("문서 종류 선택이 다시 활성화되었습니다");
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200 transition-colors"
      >
        <span className="material-symbols-outlined text-xl">category</span>
        <div>
          <div className="font-bold text-sm">문서 종류 선택 재활성화</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">업로드 시 종류 선택 창 표시</div>
        </div>
      </button>

      <button
        onClick={() => {
          toggleDark();
          setMenuOpen(false);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-left text-slate-700 dark:text-slate-200 transition-colors"
      >
        <span className="material-symbols-outlined text-xl">dark_mode</span>
        <div>
          <div className="font-bold text-sm">테마 전환</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">다크모드 / 라이트모드</div>
        </div>
      </button>

      <div className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500">
        테마 전환은 이 메뉴에서 할 수 있어요.
      </div>
    </div>
  )}
</div> {/* ✅ 이 닫는 div가 핵심 */}



                        

                        {/* Hide action buttons when welcome screen is visible */}
                        {!showWelcome && (
                            <>
                                {/* Temp Master Doc Button - Show only when no project selected */}
                                {!currentProjectId && onOpenTempMasterDoc && (
                                    <button
                                        onClick={onOpenTempMasterDoc}
                                        disabled={isLoadingProjects}
                                        className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black border shadow-sm inline-flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm ${
                                            hasTempMasterDoc
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        } ${isLoadingProjects ? 'cursor-not-allowed opacity-60' : ''}`}
                                        title={hasTempMasterDoc ? "임시 마스터 문서 활성화됨 - 이 문서를 검증 기준으로 사용합니다" : "마스터 안전 계획서 업로드 - AI가 이 기준을 참고하여 문서를 검증합니다"}
                                    >
                                        <span className="material-symbols-outlined text-base sm:text-xl">{hasTempMasterDoc ? 'check_circle' : 'description'}</span>
                                        <span className="hidden sm:inline">임시 마스터</span>
                                    </button>
                                )}

                               
                               

                                
                            </>
                        )}
                    </div>
                </div>

                {/* Breadcrumbs - Only show when not on welcome screen and has multiple items */}
                {!showWelcome && breadcrumbItems.length > 1 && (
                    <div className="px-3 sm:px-4 lg:px-6 pb-2 sm:pb-3">
                        <Breadcrumbs items={breadcrumbItems} />
                    </div>
                )}
            </header>
        );
    }
