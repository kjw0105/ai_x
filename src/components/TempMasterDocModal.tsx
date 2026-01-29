"use client";

import { useState, useRef } from "react";
import { ModalDialog } from "./ModalDialog";

interface TempMasterDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  currentDoc?: { text: string; fileName: string } | null;
  onClear?: () => void;
}

export function TempMasterDocModal({ isOpen, onClose, onUpload, currentDoc, onClear }: TempMasterDocModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      await onUpload(file);
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
      onClose();
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-3xl text-blue-500">description</span>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">임시 마스터 안전 문서</h3>
      </div>

      {currentDoc ? (
        // Show current document
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">check_circle</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-1">현재 활성화됨</p>
                <p className="text-sm text-blue-800 dark:text-blue-300">{currentDoc.fileName}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>💡 임시 마스터 문서란?</strong><br />
              프로젝트 없이 빠른 검증을 위한 기준 문서입니다. 이 문서는 현재 세션에만 유효하며 앱을 닫으면 사라집니다.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 font-bold rounded-xl transition-colors"
            >
              문서 삭제
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      ) : (
        // Upload new document
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
              <strong>💡 임시 마스터 문서란?</strong>
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
              프로젝트 없이 빠른 검증을 위한 기준 문서입니다. AI가 이 문서를 참고하여 업로드된 안전 점검 문서를 검증합니다.
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              ⚠️ 이 문서는 현재 세션에만 유효하며, 앱을 닫거나 프로젝트를 선택하면 사라집니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              PDF 파일 선택
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
            />
            {file && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                선택됨: {file.name}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </form>
      )}
    </ModalDialog>
  );
}
