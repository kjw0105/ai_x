
"use client";

import { Issue } from "@/lib/validator";
import { RefObject } from "react";

interface DocumentViewerProps {
    file: File | null;
    pageImages: string[];
    reportIssues: any[]; // type Issue[]
    onPickFile: () => void;
}

export default function DocumentViewer({ file, pageImages, reportIssues, onPickFile }: DocumentViewerProps) {
    const issueCount = reportIssues.length;

    return (
        <div className="flex-1 flex flex-col min-h-0 border-r border-slate-200 dark:border-slate-700 relative z-0 bg-slate-200/50 h-full">
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-slate-400">description</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white truncate">
                        {file?.name ?? "파일을 업로드하세요"}
                    </span>

                    {issueCount > 0 && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 font-black text-xs border border-red-200 shrink-0">
                            수정 필요 {issueCount}건
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-300/30">
                {!file && (
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

                {pageImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-full max-w-[900px] mb-8 last:mb-0">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden pdf-page-shadow relative">
                            <div className="absolute top-0 left-0 bg-slate-800/80 text-white text-xs px-2 py-1 rounded-br-lg z-10 font-mono">
                                PAGE {idx + 1}
                            </div>
                            <img src={imgUrl} alt={`Page ${idx + 1}`} className="w-full h-auto block" />
                        </div>

                        {/* Overlays can go here if we map issues to pages later */}
                    </div>
                ))}
            </div>
        </div>
    );
}
