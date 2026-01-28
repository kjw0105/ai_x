"use client";

import { Issue } from "@/lib/validator";
import { RefObject } from "react";
import { DocumentTypeBadge } from "@/components/DocumentTypeBadge";

interface DocumentViewerProps {
    file: File | null;
    pageImages: string[];
    reportIssues: any[];
    currentPage: number;
    onPageChange: (page: number) => void;
    onPickFile: () => void;
    onClearFile?: () => void;
    historicalFileName?: string; // When viewing history without file
    documentType?: string | null; // Document type for badge
}
export default function DocumentViewer({
    file,
    pageImages,
    reportIssues,
    currentPage,
    onPageChange,
    onPickFile,
    onClearFile,
    historicalFileName,
    documentType
}: DocumentViewerProps) {
    const issueCount = reportIssues.length;
    // Local state removed, using props

    const totalPages = pageImages.length;
    const hasNext = currentPage < totalPages - 1;
    const hasPrev = currentPage > 0;

    const handleNext = () => hasNext && onPageChange(currentPage + 1);
    const handlePrev = () => hasPrev && onPageChange(currentPage - 1);

    // Reset effect removed (handled by parent if needed, or implicit)

    return (
        <div className="flex-1 flex flex-col min-h-0 border-r border-slate-200 dark:border-slate-700 relative z-0 bg-slate-200/50 h-full">
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-slate-400">description</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white truncate max-w-[200px] xl:max-w-[400px]">
                        {file?.name ?? historicalFileName ?? "파일을 업로드하세요"}
                    </span>
                    {documentType && <DocumentTypeBadge type={documentType} size="sm" />}
                    {historicalFileName && !file && (
                        <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0">
                            과거 기록
                        </span>
                    )}

                    {onClearFile && (
                        <button
                            onClick={onClearFile}
                            disabled={!file}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                            title={file ? "현재 파일 삭제" : "삭제할 파일 없음"}
                        >
                            <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                    )}

                    {issueCount > 0 && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 font-black text-xs border border-red-200 shrink-0">
                            수정 필요 {issueCount}건
                        </span>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="hidden xl:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        <button
                            onClick={handlePrev}
                            disabled={!hasPrev}
                            className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">chevron_left</span>
                        </button>
                        <span className="text-xs font-bold font-mono px-2 text-slate-600 dark:text-slate-300">
                            {currentPage + 1} / {totalPages}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={!hasNext}
                            className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-300/30">
                {!file && !historicalFileName && (
                    <div className="w-full max-w-[800px] bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 mt-20">
                        <h3 className="text-2xl font-black mb-2">서류를 올려주세요</h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            PDF 또는 이미지(JPG/PNG)를 업로드하면 AI가 빠진 항목/불일치/수정사항을 알려줘요.
                        </p>
                        <button
                            onClick={onPickFile}
                            className="px-6 py-3 rounded-2xl bg-primary text-white font-black shadow-lg shadow-green-200 inline-flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">add_a_photo</span>
                            파일 업로드
                        </button>
                    </div>
                )}

                {!file && historicalFileName && (
                    <div className="w-full max-w-[800px] bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700 mt-20">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-4xl text-blue-500">history</span>
                            <h3 className="text-2xl font-black">과거 검증 기록</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">
                            이 검증은 <span className="font-bold text-slate-900 dark:text-white">{historicalFileName}</span> 파일에 대한 과거 기록입니다.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-900 dark:text-blue-200">
                                <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                                원본 문서 이미지는 보존되지 않습니다. 오른쪽 패널에서 검증 결과를 확인하실 수 있습니다.
                            </p>
                        </div>
                        <button
                            onClick={onPickFile}
                            className="px-6 py-3 rounded-2xl bg-primary text-white font-black shadow-lg shadow-green-200 inline-flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">add_a_photo</span>
                            새 파일 업로드
                        </button>
                    </div>
                )}

                {totalPages > 0 && (
                    <div className="relative w-full max-w-[900px] mb-8">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden pdf-page-shadow relative group">
                            <div className="absolute top-0 left-0 bg-slate-800/80 text-white text-xs px-2 py-1 rounded-br-lg z-10 font-mono">
                                PAGE {currentPage + 1} / {totalPages}
                            </div>

                            {/* Mobile/Floating Navigation Overlay */}
                            {totalPages > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                        disabled={!hasPrev}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-0 transition-all"
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                        disabled={!hasNext}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-0 transition-all"
                                    >
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </>
                            )}

                            <img
                                src={pageImages[currentPage]}
                                alt={`Page ${currentPage + 1}`}
                                className="w-full h-auto block select-none pointer-events-none"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
