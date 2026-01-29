
"use client";

import { useEffect, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { DocumentTypeBadge } from "./DocumentTypeBadge";

// Assuming types from validator or db, but for client usage we define what we need
interface HistoryItem {
    id: string;
    fileName: string;
    createdAt: string;
    score?: number | null;
    documentType?: string | null;
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectReport: (id: string) => void;
    onExportReport: (id: string) => void;
}

export default function HistorySidebar({ isOpen, onClose, onSelectReport, onExportReport }: HistorySidebarProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | null; fileName?: string } | null>(null);
    const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
    const toast = useToast();

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
                <div className="flex gap-1">
                    <button
                        onClick={() => setDeleteAllConfirm(true)}
                        disabled={history.length === 0}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-full disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400"
                        title={history.length === 0 ? "삭제할 기록 없음" : "모든 기록 지우기"}
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto h-full p-4 space-y-3 pb-20">
                {loading && <div className="text-center p-4 text-slate-500">불러오는 중...</div>}

                {!loading && history.length === 0 && (
                    <div className="text-center p-8 text-slate-400 text-sm">기록이 없습니다.</div>
                )}

                {history.map((item) => (
                    <div
                        key={item.id}
                        className="group relative flex items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        onClick={() => onSelectReport(item.id)}
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="font-bold text-slate-800 dark:text-white truncate flex-1">{item.fileName}</div>
                                {item.documentType && <DocumentTypeBadge type={item.documentType} size="sm" showIcon={false} />}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(item.createdAt).toLocaleString()}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onExportReport(item.id);
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"
                                title="PDF 다시 내보내기"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({ id: item.id, fileName: item.fileName });
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full"
                                title="삭제"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Single Item Confirmation */}
            <ConfirmModal
                isOpen={deleteConfirm !== null}
                title="기록 삭제"
                message={`정말로 "${deleteConfirm?.fileName}" 기록을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`}
                confirmText="삭제"
                cancelText="취소"
                variant="danger"
                onConfirm={() => {
                    if (deleteConfirm?.id) {
                        fetch(`/api/history?id=${deleteConfirm.id}`, { method: "DELETE" })
                            .then(() => {
                                setHistory(prev => prev.filter(h => h.id !== deleteConfirm.id));
                                setDeleteConfirm(null);
                                toast.success("기록이 삭제되었습니다");
                            })
                            .catch(() => toast.error("기록 삭제에 실패했습니다"));
                    }
                }}
                onCancel={() => setDeleteConfirm(null)}
            />

            {/* Delete All Confirmation */}
            <ConfirmModal
                isOpen={deleteAllConfirm}
                title="모든 기록 삭제"
                message={`정말로 모든 검증 기록을 삭제하시겠습니까?\n\n총 ${history.length}개의 기록이 영구적으로 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`}
                confirmText="모두 삭제"
                cancelText="취소"
                variant="danger"
                onConfirm={() => {
                    fetch("/api/history", { method: "DELETE" })
                        .then(() => {
                            setHistory([]);
                            setDeleteAllConfirm(false);
                            toast.success("모든 기록이 삭제되었습니다");
                        })
                        .catch(() => toast.error("기록 삭제에 실패했습니다"));
                }}
                onCancel={() => setDeleteAllConfirm(false)}
            />
        </div>
    );
}
