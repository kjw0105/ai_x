"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";

interface EditProjectModalProps {
    isOpen: boolean;
    project: {
        id: string;
        name: string;
        description: string;
    } | null;
    onClose: () => void;
    onUpdate: (id: string, data: any) => Promise<void>;
}

export function EditProjectModal({ isOpen, project, onClose, onUpdate }: EditProjectModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || "");
            setFile(null); // Reset file when project changes
        }
    }, [project]);

    if (!isOpen || !project) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!project) return;

        setLoading(true);
        try {
            await onUpdate(project.id, { name, description, file });
            toast.success("프로젝트가 업데이트되었습니다");
            onClose();
        } catch (err) {
            console.error("Failed to update project:", err);
            toast.error("프로젝트 업데이트에 실패했습니다");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined">edit</span>
                    프로젝트 수정
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            프로젝트 이름
                        </label>
                        <input
                            required
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            설명
                        </label>
                        <input
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            마스터 안전 계획서 (선택사항)
                        </label>
                        <input
                            type="file"
                            accept="application/pdf"
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            프로젝트의 안전 규칙 및 기준 문서입니다. 새 파일을 업로드하면 기존 계획서를 교체합니다.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
