"use client";

import { useState } from "react";

interface EmptyDocumentStateProps {
    onUploadClick: () => void;
    onFileSelect: (file: File) => void;
    onStartTBM?: () => void;
}

export function EmptyDocumentState({ onUploadClick, onFileSelect, onStartTBM }: EmptyDocumentStateProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const validFile = files.find(f =>
            f.type === "application/pdf" || f.type.startsWith("image/")
        );

        if (validFile) {
            onFileSelect(validFile);
        }
    };

    return (
        <div
            className="flex items-center justify-center h-full bg-slate-50 dark:bg-gray-900 p-8"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white dark:bg-slate-800 p-10 shadow-lg w-full max-w-md">
                <button
                    onClick={onUploadClick}
                    className="w-full px-6 py-4 rounded-2xl bg-primary text-white font-black shadow-lg shadow-green-200 inline-flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                    title="문서 업로드"
                >
                    <span className="material-symbols-outlined">upload</span>
                    파일 업로드
                </button>
                {onStartTBM && (
                    <button
                        onClick={onStartTBM}
                        className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold inline-flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="TBM 시작"
                    >
                        <span className="material-symbols-outlined">mic</span>
                        TBM 시작
                    </button>
                )}
                {isDragging && (
                    <div className="text-xs text-blue-600 dark:text-blue-300 font-semibold">
                        파일을 놓으면 바로 업로드됩니다
                    </div>
                )}
            </div>
        </div>
    );
}
