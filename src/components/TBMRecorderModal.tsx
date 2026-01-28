"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TBMResult = {
  transcript: string;
  summary: string;
};

interface TBMRecorderModalProps {
  isOpen: boolean;
  projectId?: string | null;
  onClose: () => void;
  onComplete?: (result: TBMResult) => void;
}

export default function TBMRecorderModal({ isOpen, projectId, onClose, onComplete }: TBMRecorderModalProps) {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<TBMResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const canStart = useMemo(() => isOpen && !isRecording && !isUploading, [isOpen, isRecording, isUploading]);
  const canStop = useMemo(() => isOpen && isRecording && !isUploading, [isOpen, isRecording, isUploading]);

  useEffect(() => {
    if (!isOpen) return;
    // Open할 때마다 초기화
    setPermissionError(null);
    setResult(null);
    setAudioUrl(null);
    chunksRef.current = [];

    return () => {
      // Cleanup any active stream
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      streamRef.current = null;
      mediaRecorderRef.current = null;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function startRecording() {
    setPermissionError(null);
    setResult(null);
    setAudioUrl(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          await uploadAndAnalyze(blob);
        } catch (e: any) {
          setPermissionError(e?.message ?? "녹음 파일 처리 중 오류가 발생했습니다.");
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (e: any) {
      setPermissionError(
        "마이크 권한이 필요해요. 브라우저 주소창 왼쪽의 🔒(또는 설정)에서 마이크 권한을 허용해 주세요."
      );
      console.error(e);
    }
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === "inactive") return;
    mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  }

  async function uploadAndAnalyze(blob: Blob) {
    setIsUploading(true);
    setPermissionError(null);
    try {
      const fd = new FormData();
      fd.append("audio", blob, `tbm_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.webm`);
      if (projectId) fd.append("projectId", projectId);

      const res = await fetch("/api/tbm", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "TBM 분석에 실패했습니다.");
      }

      const r: TBMResult = {
        transcript: data.transcript ?? "",
        summary: data.summary ?? "",
      };
      setResult(r);
      onComplete?.(r);
    } finally {
      setIsUploading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">TBM 시작</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              작업 전 대화를 녹음하면 AI가 핵심 내용, 위험요인, 조치사항을 요약해요.
            </p>
          </div>
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100"
            title="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {permissionError && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="text-sm font-bold text-red-800 dark:text-red-300">문제가 발생했어요</div>
            <div className="text-sm text-red-700 dark:text-red-400 mt-1">{permissionError}</div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={startRecording}
            disabled={!canStart}
            className="px-4 py-2 rounded-xl bg-primary text-white font-black shadow-lg shadow-green-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">mic</span>
            녹음 시작
          </button>
          <button
            onClick={stopRecording}
            disabled={!canStop}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-black shadow-lg shadow-red-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">stop_circle</span>
            녹음 종료
          </button>

          <div className="ml-auto flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2">
            <span className={`size-2 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : isUploading ? "bg-yellow-400 animate-pulse" : "bg-slate-400"}`} />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-200">
              {isRecording ? "녹음 중" : isUploading ? "AI 분석 중" : result ? "분석 완료" : "대기"}
            </span>
          </div>
        </div>

        {audioUrl && (
          <div className="mb-6">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">녹음 미리듣기</div>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-black text-slate-800 dark:text-white mb-2">요약</div>
              <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 font-sans">{result.summary}</pre>
            </div>
            <details className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <summary className="cursor-pointer text-sm font-black text-slate-800 dark:text-white">전사(Transcript) 보기</summary>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 font-sans">{result.transcript}</pre>
            </details>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-6">
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
