"use client";

import { useState } from "react";

interface EmptyDocumentStateProps {
    onFileSelect: (file: File) => void;
}

export function EmptyDocumentState({ onFileSelect }: EmptyDocumentStateProps) {
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
            <div
                className={`flex flex-col items-center justify-center gap-6 p-12 rounded-3xl border-2 border-dashed transition-all duration-300 max-w-md w-full ${isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    }`}
            >
                {/* Icon */}
                <div className={`relative ${isDragging ? "animate-bounce" : ""}`}>
                    <div className="size-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-6xl text-white">
                            upload_file
                        </span>
                    </div>
                    {isDragging && (
                        <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
                    )}
                </div>

                {/* Text */}
                <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        {isDragging ? "파일을 여기에 놓으세요" : "파일 업로드"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                        {isDragging
                            ? "파일을 드롭하여 검증 시작"
                            : "파일을 드래그하여 업로드"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                        PDF 또는 이미지 파일 (JPG, PNG)
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">category</span>
                        문서 종류 선택 가능
                    </div>
                </div>

                {/* Hint */}
                {!isDragging && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-sm">info</span>
                        <span>상단의 &quot;파일 업로드&quot; 버튼으로 업로드하세요</span>
                    </div>
                )}
            </div>
        </div>
    );
}
