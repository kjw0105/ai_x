"use client";

import { useState } from "react";
import { DOCUMENT_TYPES, DocumentType } from "@/lib/documentTypes";

interface DocumentTypeSelectorProps {
    isOpen: boolean;
    fileName: string;
    onSelect: (type: DocumentType) => void;
    onSkip: () => void;
}

export function DocumentTypeSelector({ isOpen, fileName, onSelect, onSkip }: DocumentTypeSelectorProps) {
    const [selected, setSelected] = useState<DocumentType | null>(null);
    const [dontAskAgain, setDontAskAgain] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selected) {
            if (dontAskAgain) {
                localStorage.setItem("skip_document_type_selector", "true");
            }
            onSelect(selected);
        }
    };

    const handleSkip = () => {
        if (dontAskAgain) {
            localStorage.setItem("skip_document_type_selector", "true");
        }
        onSkip();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                    문서 유형 선택
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    <span className="font-semibold">{fileName}</span>의 문서 유형을 선택하세요. 나중에 더 쉽게 찾을 수 있습니다.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    {Object.entries(DOCUMENT_TYPES)
                        // TBM은 '업로드된 문서 검증' 흐름에서 제외 (TBM은 앱 내 녹음 기능으로 진행)
                        .filter(([key]) => key !== "TBM")
                        .map(([key, info]) => {
                        const isSelected = selected === key;
                        const colorClasses = {
                            blue: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                            green: "border-green-500 bg-green-50 dark:bg-green-900/20",
                            orange: "border-orange-500 bg-orange-50 dark:bg-orange-900/20",
                            purple: "border-purple-500 bg-purple-50 dark:bg-purple-900/20",
                            gray: "border-slate-400 bg-slate-50 dark:bg-slate-700/20",
                        };

                        return (
                            <button
                                key={key}
                                onClick={() => setSelected(key as DocumentType)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${
                                    isSelected
                                        ? `${colorClasses[info.color as keyof typeof colorClasses]} shadow-lg scale-105`
                                        : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`material-symbols-outlined text-3xl ${
                                            isSelected ? `text-${info.color}-600 dark:text-${info.color}-400` : "text-slate-400"
                                        }`}
                                    >
                                        {info.icon}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-bold text-sm ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                                            {info.shortLabel}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {info.label}
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">
                                            check_circle
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dontAskAgain}
                            onChange={(e) => setDontAskAgain(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            다음부터 묻지 않기
                        </span>
                    </label>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSkip}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            건너뛰기
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selected}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
