"use client";

import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export function NewProjectModal({ isOpen, onClose, onCreated }: NewProjectModalProps) {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name) return;

        setLoading(true);
        setError(null);

        try {
            let extractedText = "";

            // 1. Extract Text from PDF (if provided)
            if (file) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

                const maxPages = pdf.numPages;
                const textParts = [];

                // Extract text from ALL pages for the Master Plan (Context)
                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(" ");
                    textParts.push(`--- Page ${i} ---\n${pageText}`);
                }

                extractedText = textParts.join("\n\n");
            }

            // 2. Send to API
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    description: desc,
                    contextText: extractedText
                })
            });

            if (!res.ok) {
                throw new Error("Failed to create project");
            }

            onCreated();
            onClose();
            // Reset form
            setName("");
            setDesc("");
            setFile(null);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">새 프로젝트 생성</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">프로젝트명 *</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="예: 김포 한강 공구 A"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">설명</label>
                        <textarea
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                            placeholder="설명을 입력하세요 (선택사항)"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            마스터 안전 계획 / 컨텍스트 (PDF)
                        </label>
                        <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-gray-600 transition-colors">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="context-file"
                            />
                            <label htmlFor="context-file" className="cursor-pointer flex flex-col items-center gap-1">
                                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm text-gray-400">
                                    {file ? file.name : "마스터 플랜 업로드 (클릭)"}
                                </span>
                                <span className="text-xs text-gray-600">
                                    AI가 이 문서를 기준으 일일 보고서를 검증합니다
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            프로젝트 생성
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
