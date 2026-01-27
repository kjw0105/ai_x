import { ProjectSelector } from "./ProjectSelector";

interface HeaderProps {
    loading: boolean;
    reportExists: boolean;
    onUpload: () => void;
    onShowHistory: () => void;
    toggleDark: () => void;

    // Project Props
    currentProjectId: string | null;
    onProjectChange: (id: string | null) => void;
    onOpenNewProject: () => void;
}

export default function Header({
    loading,
    reportExists,
    onUpload,
    onShowHistory,
    toggleDark,
    currentProjectId,
    onProjectChange,
    onOpenNewProject
}: HeaderProps) {
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark px-6 py-4 shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 text-slate-800 dark:text-white">
                    <div className="size-12 flex items-center justify-center bg-primary rounded-xl text-white shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined text-3xl">safety_check</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                            스마트 안전지킴이
                        </h2>
                        <p className="text-xs text-slate-500 font-bold">경상남도 중소기업 지원 시스템</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ProjectSelector
                    currentProjectId={currentProjectId}
                    onProjectChange={onProjectChange}
                    onOpenNewProject={onOpenNewProject}
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

                <button
                    onClick={onShowHistory}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-bold"
                    title="기록 보기"
                >
                    <span className="material-symbols-outlined">history</span>
                </button>

                <button
                    onClick={toggleDark}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-bold"
                    title="다크모드 토글"
                >
                    <span className="material-symbols-outlined">dark_mode</span>
                </button>

                <button
                    onClick={onUpload}
                    className="px-4 py-2 rounded-xl bg-primary text-white font-black shadow-lg shadow-green-200 inline-flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">upload</span>
                    파일 업로드
                </button>
            </div>
        </header>
    );
}
