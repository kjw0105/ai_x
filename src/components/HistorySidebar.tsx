
"use client";

import { useEffect, useState } from "react";
// Assuming types from validator or db, but for client usage we define what we need
interface HistoryItem {
    id: string;
    fileName: string;
    createdAt: string;
    score?: number | null;
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectReport: (id: string) => void;
}

export default function HistorySidebar({ isOpen, onClose, onSelectReport }: HistorySidebarProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch("/api/history")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setHistory(data);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    return (
        <div
            className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-surface-dark shadow-2xl transform transition-transform duration-300 z-50 border-l border-slate-200 dark:border-slate-700 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined">history</span>
                    최근 검증 기록
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <div className="overflow-y-auto h-full p-4 space-y-3 pb-20">
                {loading && <div className="text-center p-4 text-slate-500">불러오는 중...</div>}

                {!loading && history.length === 0 && (
                    <div className="text-center p-8 text-slate-400 text-sm">기록이 없습니다.</div>
                )}

                {history.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onSelectReport(item.id)}
                        className="w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all group"
                    >
                        <div className="font-bold text-slate-800 dark:text-white truncate mb-1">{item.fileName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(item.createdAt).toLocaleString()}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
