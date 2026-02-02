"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

type RecordingHUDProps = {
  stream: MediaStream | null;
  isRecording: boolean;
  startedAtMs: number | null; // performance.now() 찍은 값
};

export default function RecordingHUD({ stream, isRecording, startedAtMs }: RecordingHUDProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  // 🔥 바 형태로 간단하게 “파동처럼” 보이게 (실시간 진폭 기반)
  const bars = useMemo(() => new Array(24).fill(0), []);
  const [levels, setLevels] = useState<number[]>(() => bars.map(() => 0.15));

  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // 타이머
  useEffect(() => {
    if (!isRecording || startedAtMs == null) return;

    const tick = () => setElapsedMs(Math.max(0, performance.now() - startedAtMs));
    tick();
    const id = window.setInterval(tick, 200);

    return () => window.clearInterval(id);
  }, [isRecording, startedAtMs]);

  // 마이크 진폭 분석 (Web Audio API)
  useEffect(() => {
    if (!isRecording || !stream) return;

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;
    const bufferLength = analyser.frequencyBinCount; // ✅ 추가
    dataRef.current = new Uint8Array(new ArrayBuffer(bufferLength)); // ✅ OK
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    dataRef.current = new Uint8Array(new ArrayBuffer(bufferLength));


    const loop = () => {
      if (!analyserRef.current || !dataRef.current) return;

      analyserRef.current.getByteTimeDomainData(dataRef.current);

      // 진폭(0~1) 계산
      let sum = 0;
      for (let i = 0; i < dataRef.current.length; i++) {
        const v = (dataRef.current[i] - 128) / 128; // -1 ~ 1
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataRef.current.length); // 0~1
      const amp = Math.min(1, Math.max(0.05, rms * 2.2));

      // 바를 “파동”처럼 흔들리게 만들기 (기본 레벨 + 난수 살짝)
      setLevels((prev) =>
        prev.map((p, idx) => {
          const noise = (Math.random() - 0.5) * 0.25;
          const base = 0.12 + (idx % 6) * 0.03;
          const next = base + amp + noise;
          // 부드럽게 보간
          return Math.max(0.08, Math.min(1, p * 0.6 + next * 0.4));
        })
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        source.disconnect();
      } catch {}
      try {
        analyser.disconnect();
      } catch {}
      try {
        ctx.close();
      } catch {}
      audioCtxRef.current = null;
      analyserRef.current = null;
      dataRef.current = null;
    };
  }, [isRecording, stream]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-2.5 rounded-full bg-red-500 animate-pulse" />
          <div className="font-black text-slate-800 dark:text-white">녹음 중</div>
        </div>

        <div className="font-mono font-black text-slate-800 dark:text-white tabular-nums">
          {formatTime(elapsedMs)}
        </div>
      </div>

      <div className="mt-3 flex items-end gap-1.5 h-10">
        {levels.map((lv, i) => (
          <div
            key={i}
            className="flex-1 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden"
            style={{ height: "100%" }}
          >
            <div
              className="w-full rounded-full bg-green-500/90"
              style={{ height: `${Math.round(lv * 100)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        말할수록 파동이 커져요
      </div>
    </div>
  );
}
