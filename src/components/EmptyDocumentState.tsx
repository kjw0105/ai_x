"use client";

import { useState } from "react";

interface EmptyDocumentStateProps {
  onFileSelect: (file: File) => void;
  onStartTBM?: () => void;
  onUploadClick?: () => void;
}

export function EmptyDocumentState({
  onUploadClick,
  onFileSelect,
  onStartTBM,
}: EmptyDocumentStateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [debugTap, setDebugTap] = useState<string>(""); // ✅ 화면에 표시용

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
    const validFile = files.find(
      (f) => f.type === "application/pdf" || f.type.startsWith("image/")
    );

    if (validFile) onFileSelect(validFile);
  };

  // ✅ iOS에서 onClick이 안 먹는 경우가 있어서 Pointer/Touch로도 보강
  const fireTBM = () => {
    setDebugTap("✅ TBM 버튼 눌림"); // 콘솔 말고 화면에 표시
    try {
      onStartTBM?.();
    } catch (e) {
      setDebugTap("❌ TBM 핸들러 에러(콘솔 확인)");
      // eslint-disable-next-line no-console
      console.error("[TBM] handler crashed:", e);
    }
  };

  const fireUpload = () => {
    setDebugTap("✅ 업로드 버튼 눌림");
    try {
      onUploadClick?.();
    } catch (e) {
      setDebugTap("❌ 업로드 핸들러 에러(콘솔 확인)");
      // eslint-disable-next-line no-console
      console.error("[Upload] handler crashed:", e);
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
        className={[
          "relative z-10", // ✅ 혹시 위에 투명 레이어가 있으면 대비
          "flex flex-col items-center justify-center gap-6 p-12 rounded-3xl border-2 border-dashed transition-all duration-300 max-w-md w-full",
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-slate-950 scale-105"
            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950",
        ].join(" ")}
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
            {isDragging ? "파일을 드롭하여 검증 시작" : "파일을 드래그하여 업로드"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
            PDF 또는 이미지 파일 (JPG, PNG)
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
            <span className="material-symbols-outlined text-sm">category</span>
            문서 종류 선택 가능
          </div>
        </div>

        {/* ✅ Debug label (화면 표시) */}
        {debugTap && (
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl w-full text-center">
            {debugTap}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={fireUpload}
            onPointerUp={fireUpload}
            onTouchEnd={fireUpload}
            className="relative z-20 w-full px-5 py-3 rounded-2xl bg-primary text-white font-black inline-flex items-center justify-center gap-2 hover:bg-green-600 active:scale-[0.99] transition"
            style={{ touchAction: "manipulation" }}
            title="문서 업로드"
          >
            <span className="material-symbols-outlined">upload</span>
            파일 업로드
          </button>

          {onStartTBM && (
            <button
              type="button"
              onClick={fireTBM}
              onPointerUp={fireTBM}
              onTouchEnd={fireTBM}
              className="relative z-20 w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold inline-flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.99] transition"
              style={{ touchAction: "manipulation" }}
              title="TBM 시작"
            >
              <span className="material-symbols-outlined">mic</span>
              TBM 시작
            </button>
          )}
        </div>

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
