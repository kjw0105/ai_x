"use client";

import React, { useEffect, useRef, useState } from "react";
import RecordingHUD from "@/components/RecordingHUD";

type Props = {
  open: boolean;
  onClose: () => void;

  // ✅ Page에서 mode를 내려줌 (record | upload)
  mode?: "record" | "upload";

  onDone?: (audio: Blob, durationMs: number) => void;
  projectId: string | null;

  onComplete: (r: any) => void;
};

async function ensureMicOrWarn(): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    alert("이 브라우저에서는 마이크 장치 확인을 지원하지 않습니다.");
    return null;
  }

  const ds = await navigator.mediaDevices.enumerateDevices();
  const hasMic = ds.some((d) => d.kind === "audioinput");
  if (!hasMic) {
    alert(
      "마이크 입력 장치가 없습니다.\n\nWindows '설정 > 시스템 > 소리 > 입력'에서 마이크를 활성화하거나 USB/블루투스 마이크를 연결해 주세요."
    );
    return null;
  }

  try {
    // ✅ 여기서 권한 요청/스트림 획득
    const s = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false as any,
      },
      video: false,
    });
    return s;
  } catch (e) {
    alert("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해 주세요.");
    return null;
  }
}


function guessExt(mime: string) {
  const m = (mime || "").toLowerCase();
  if (m.includes("x-m4a") || m.includes("m4a")) return "m4a";
  if (m.includes("mp4")) return "m4a";
  if (m.includes("mpeg")) return "mp3";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("wav")) return "wav";
  if (m.includes("webm")) return "webm";
  return "webm";
}


export default function TBMRecorderModal({
  open,
  onClose,
  onDone,
  projectId,
  onComplete,
  mode: initialMode = "record", // ✅ 이 한 줄이 "initialMode" 에러 해결 핵심
}: Props) {
  const [mode, setMode] = useState<"record" | "upload">(initialMode);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // 음성 감지(무음이면 서버로 안 보내기)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const voiceFramesRef = useRef(0);
  const totalFramesRef = useRef(0);

  // ✅ 모달 열릴 때: Page에서 내려준 initialMode(=props.mode)로 탭 맞추기
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
  }, [open, initialMode]);

  // ✅ 모달 열릴 때 마이크 준비 (record 탭일 때만)
  

  // ✅ 모달 닫힐 때 정리
  useEffect(() => {
    if (open) return;

    setIsRecording(false);
    setStartedAtMs(null);
    chunksRef.current = [];
    voiceFramesRef.current = 0;
    totalFramesRef.current = 0;

    try {
      recorderRef.current?.stop?.();
    } catch {}

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    analyserRef.current?.disconnect?.();
    analyserRef.current = null;

    audioCtxRef.current?.close?.();
    audioCtxRef.current = null;

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function startVoiceMeter(s: MediaStream) {
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;

      const src = ctx.createMediaStreamSource(s);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      analyserRef.current = analyser;

      const buf = new Uint8Array(analyser.fftSize);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(buf);

        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);

        totalFramesRef.current += 1;
        if (rms > 0.03) voiceFramesRef.current += 1;

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn("voice meter init failed", e);
    }
  }

  async function postAudioToServer(audioBlob: Blob, durationMs: number) {
    // ✅ 업로드 탭에서 File을 Blob으로 보낼 수도 있으므로 size/duration 가드 완화(파일업로드는 duration 정확도 낮음)
    if (audioBlob.size < 8_000) {
      alert("파일이 너무 작거나 비어있어요. 다른 파일로 다시 시도해 주세요.");
      return;
    }

    // ✅ 녹음 탭일 때만 무음 프레임 체크
    if (mode === "record") {
      const total = totalFramesRef.current;
      const voice = voiceFramesRef.current;
      if (total > 20) {
        const ratio = voice / total;
        if (ratio < 0.08) {
          alert("음성이 거의 감지되지 않았어요. 주변 소음만 녹음된 것 같아요.");
          return;
        }
      }
      if (durationMs < 1200) {
        alert("2초 이상 또렷하게 말해 주세요.");
        return;
      }
    }

    setIsPosting(true);
    try {
      const form = new FormData();
      const ext = guessExt(audioBlob.type || "audio/webm");
      const isFile = audioBlob instanceof File;
const filename = isFile ? audioBlob.name : `tbm.${ext}`;
form.append("audio", audioBlob, filename);

      if (projectId) form.append("projectId", projectId);

      const res = await fetch("/api/tbm", { method: "POST", body: form });
      const text = await res.text().catch(() => "");
      if (!res.ok) {
        let msg = text;
        try {
          const j = JSON.parse(text);
          msg = j?.error || text;
        } catch {}
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const r = JSON.parse(text);
      onComplete(r);
    } catch (e) {
      console.error(e);
      alert("TBM 요약 생성에 실패했습니다.");
    } finally {
      setIsPosting(false);
    }
  }

  const start = async () => {
  console.log("[TBM] start clicked", { hasStream: !!stream });

  // ✅ 버튼 클릭 시에만 마이크 체크 + 권한 요청 + stream 확보
  let s = stream;
  if (!s) {
    const newStream = await ensureMicOrWarn();
    if (!newStream) {
      // (선택) 실패 시 업로드 탭으로 유도
      setMode("upload");
      return;
    }
    s = newStream;
    setStream(newStream);
  }

  chunksRef.current = [];
  voiceFramesRef.current = 0;
  totalFramesRef.current = 0;

  const options: MediaRecorderOptions = {};
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    options.mimeType = "audio/webm;codecs=opus";
  } else if (MediaRecorder.isTypeSupported("audio/webm")) {
    options.mimeType = "audio/webm";
  } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
    options.mimeType = "audio/mp4";
  }
  (options as any).audioBitsPerSecond = 64000;

  const rec = new MediaRecorder(s, options);
  recorderRef.current = rec;

  startVoiceMeter(s);

  const startedAt = performance.now();
  setStartedAtMs(startedAt);
  setIsRecording(true);

  rec.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
  };

  rec.onstop = async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
    const durationMs = Math.max(0, performance.now() - startedAt);

    onDone?.(blob, durationMs);
    await postAudioToServer(blob, durationMs);

    setIsRecording(false);
    setStartedAtMs(null);
  };

  rec.start(250);
};


  const stop = () => {
    console.log("[TBM] stop clicked", recorderRef.current?.state);
    if (!recorderRef.current) return;
    setIsRecording(false);
    recorderRef.current.stop();
  };

  const onUploadFile = async (f: File | null) => {
    if (!f) return;

    // ✅ File도 Blob이라 그대로 전송 가능
    // 업로드는 duration을 정확히 모르니 큰 값으로 넣어도 됨(녹음탭에서만 duration 체크함)
    await postAudioToServer(f, 5000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="font-black text-slate-900 dark:text-white">TBM</div>
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
          {/* ✅ 탭 */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
            <button
              className={`flex-1 py-2 rounded-2xl font-black ${
                mode === "record" ? "bg-slate-900 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setMode("record")}
              disabled={isRecording || isPosting}
            >
              녹음
            </button>
            <button
              className={`flex-1 py-2 rounded-2xl font-black ${
                mode === "upload" ? "bg-slate-900 text-white" : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setMode("upload")}
              disabled={isRecording || isPosting}
            >
              파일 업로드
            </button>
          </div>

          {mode === "record" ? (
            <>
              <RecordingHUD stream={stream} isRecording={isRecording} startedAtMs={startedAtMs} />

              <div className="flex gap-2">
                {!isRecording ? (
                  <button
                    onClick={start}
                    disabled={isPosting}
                    className="flex-1 px-4 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black disabled:opacity-50"
                  >
                    {isPosting ? "처리 중..." : "녹음 시작"}
                  </button>
                ) : (
                  <button
                    onClick={stop}
                    disabled={isPosting}
                    className="flex-1 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black disabled:opacity-50"
                  >
                    녹음 중지
                  </button>
                )}

                <button
                  onClick={onClose}
                  disabled={isPosting}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black disabled:opacity-50"
                >
                  닫기
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                * 2초 이상 또렷하게 말해 주세요.
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">음성 파일 업로드</div>
                <input
                  type="file"
                  accept="audio/*"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                  onChange={(e) => onUploadFile(e.target.files?.[0] ?? null)}
                  disabled={isPosting}
                />
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  * 데스크탑에서도 여기서 TBM 음성 파일 업로드 가능합니다.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  disabled={isPosting}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black disabled:opacity-50"
                >
                  닫기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
