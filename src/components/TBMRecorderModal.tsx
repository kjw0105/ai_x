"use client";

import React, { useEffect, useRef, useState } from "react";
import RecordingHUD from "@/components/RecordingHUD";

type Props = {
  open: boolean;
  onClose: () => void;
  onDone?: (audio: Blob, durationMs: number) => void; // 저장/업로드용
  projectId: string | null;
  
  onComplete: (r: any) => void;
};

export default function TBMRecorderModal({ open, onClose, onDone, projectId, onComplete }: Props) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // 모달 열릴 때 마이크 준비
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
      } catch (e) {
        console.error(e);
        alert("마이크 권한이 필요합니다.");
        onClose();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, onClose]);

  // 모달 닫힐 때 정리
  useEffect(() => {
    if (open) return;

    setIsRecording(false);
    setStartedAtMs(null);
    chunksRef.current = [];
    recorderRef.current?.stop?.();

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
  }, [open]); // eslint-disable-line

  const start = () => {
    console.log("[TBM] start clicked", { hasStream: !!stream });
    if (!stream) return;

    chunksRef.current = [];

    // mimeType은 브라우저마다 다름 → 안전하게 try
    const options: MediaRecorderOptions = {};
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      options.mimeType = "audio/webm;codecs=opus";
    } else if (MediaRecorder.isTypeSupported("audio/webm")) {
      options.mimeType = "audio/webm";
    }

    const rec = new MediaRecorder(stream, options);
    recorderRef.current = rec;

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };

    rec.onstop = async () => {
      console.log("[TBM] onstop fired");
  const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
  const durationMs = startedAtMs ? Math.max(0, performance.now() - startedAtMs) : 0;

  // 선택: 저장/업로드용 콜백
  onDone?.(blob, durationMs);

  try {
    const form = new FormData();
    form.append("file", blob, "tbm.webm");
    if (projectId) form.append("projectId", projectId);

    const res = await fetch("/api/tbm", { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text());

    const r = await res.json();

    // ✅ 제일 중요: 부모 page.tsx 로 결과 전달
    console.log("[TBM] got result", r);
    onComplete(r);
  } catch (e) {
    console.error(e);
    alert("TBM 요약 생성에 실패했습니다.");
  }
};


    setStartedAtMs(performance.now());
    setIsRecording(true);
    rec.start(250); // 250ms 단위로 chunk 수집
  };

  const stop = () => {
  console.log("[TBM] stop clicked", recorderRef.current?.state);
  if (!recorderRef.current) return;
  setIsRecording(false);
  recorderRef.current.stop();
};

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="font-black text-slate-900 dark:text-white">TBM 녹음</div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="닫기"
            title="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ✅ 타이머 + 파동 UI */}
          <RecordingHUD stream={stream} isRecording={isRecording} startedAtMs={startedAtMs} />

          <div className="flex gap-2">
            {!isRecording ? (
              <button
                onClick={start}
                disabled={!stream}
                className="flex-1 px-4 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black disabled:opacity-50"
              >
                녹음 시작
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex-1 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black"
              >
                녹음 중지
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black"
            >
              닫기
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            * iOS/Safari는 처음 클릭 시에만 오디오가 활성화될 수 있어요.
          </div>
        </div>
      </div>
    </div>
  );
}
