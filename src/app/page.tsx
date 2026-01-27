"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Severity = "error" | "warn" | "info";

type Issue = {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  page?: number;
  bbox?: { x: number; y: number; w: number; h: number };
};

type Report = {
  fileName: string;
  issues: Issue[];
  chat: { role: "ai" | "user"; text: string }[];
};

function severityBorder(sev: Severity) {
  if (sev === "error") return "border-l-red-500";
  if (sev === "warn") return "border-l-orange-500";
  return "border-l-slate-400";
}

let pdfjsPromise: Promise<any> | null = null;
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
      (pdfjs as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const isPdf = useMemo(() => file?.type === "application/pdf", [file]);
  const isImage = useMemo(() => !!file?.type.startsWith("image/"), [file]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function toggleDark() {
    document.documentElement.classList.toggle("dark");
  }

  function pickFileDialog() {
    fileInputRef.current?.click();
  }

  async function renderPdfFirstPage(pdfFile: File) {
    const canvas = pdfCanvasRef.current;
    if (!canvas) return;

    const pdfjs = await getPdfjs();
    const buf = await pdfFile.arrayBuffer();
    const pdf = await (pdfjs as any).getDocument({ data: buf }).promise;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.4 });

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  async function extractPdfText(pdfFile: File) {
    const pdfjs = await getPdfjs();
    const buf = await pdfFile.arrayBuffer();
    const pdf = await (pdfjs as any).getDocument({ data: buf }).promise;

    let full = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it: any) => (typeof it.str === "string" ? it.str : ""))
        .join(" ");
      full += `\n[PAGE ${p}]\n${pageText}\n`;
    }
    return full;
  }

  async function runValidation(f: File) {
    setLoading(true);
    try {
      let text = "";
      if (f.type === "application/pdf") {
        await renderPdfFirstPage(f);
        text = await extractPdfText(f);
      }

      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: f.name, text })
      });

      const data = (await res.json()) as Report;
      setReport(data);
    } catch (e) {
      console.error(e);
      setReport({
        fileName: f.name,
        issues: [
          {
            id: "err",
            severity: "error",
            title: "검증 중 오류",
            message: "검증 처리 중 문제가 발생했어요. 브라우저 콘솔을 확인해 주세요."
          }
        ],
        chat: [{ role: "ai", text: "검증을 시도했는데 오류가 났어요. 다시 시도해 볼까요?" }]
      });
    } finally {
      setLoading(false);
    }
  }

  async function onPickFile(f: File) {
    setFile(f);
    setReport(null);
    await runValidation(f);
  }

  const issueCount = report?.issues?.length ?? 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onPickFile(f);
        }}
      />

      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark px-6 py-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-slate-800 dark:text-white">
            <div className="size-12 flex items-center justify-center bg-primary rounded-xl text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-3xl">safety_check</span>
            </div>
            <div>
              <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                스마트 안전지킴이
              </h2>
              <p className="text-xs text-slate-500 font-bold">경상남도 중소기업 지원 시스템</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2">
            <span
              className={`size-2 rounded-full ${
                loading ? "bg-yellow-400 animate-pulse" : report ? "bg-green-500" : "bg-slate-400"
              }`}
            />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-200">
              {loading ? "AI 분석 중" : report ? "AI 분석 완료" : "대기 중"}
            </span>
          </div>

          <button
            onClick={toggleDark}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 font-bold"
            title="다크모드 토글"
          >
            <span className="material-symbols-outlined">dark_mode</span>
          </button>

          <button
            onClick={pickFileDialog}
            className="px-4 py-2 rounded-xl bg-primary text-white font-black shadow-lg shadow-green-200 inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined">upload</span>
            파일 업로드
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden bg-slate-50 dark:bg-gray-900">
        <div className="flex-1 flex flex-col min-h-0 border-r border-slate-200 dark:border-slate-700 relative z-0 bg-slate-200/50">
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-slate-400">description</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white truncate">
                {file?.name ?? "파일을 업로드하세요"}
              </span>

              {report && (
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 font-black text-xs border border-red-200 shrink-0">
                  수정 필요 {issueCount}건
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-300/30">
            {!file && (
              <div className="w-full max-w-[800px] bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                <h3 className="text-2xl font-black mb-2">서류를 올려주세요</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  PDF 또는 이미지(JPG/PNG)를 업로드하면 AI가 빠진 항목/불일치/수정사항을 알려줘요.
                </p>
                <button
                  onClick={pickFileDialog}
                  className="px-6 py-3 rounded-2xl bg-primary text-white font-black shadow-lg shadow-green-200 inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add_a_photo</span>
                  파일 업로드
                </button>
              </div>
            )}

            {file && isImage && previewUrl && (
              <div className="relative w-full max-w-[900px]">
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white"
                />
                {report?.issues?.filter((i) => i.bbox).map((i) => (
                  <div
                    key={i.id}
                    className="hand-drawn-circle absolute pointer-events-none"
                    style={{
                      left: `${(i.bbox!.x ?? 0) * 100}%`,
                      top: `${(i.bbox!.y ?? 0) * 100}%`,
                      width: `${(i.bbox!.w ?? 0) * 100}%`,
                      height: `${(i.bbox!.h ?? 0) * 100}%`
                    }}
                  />
                ))}
              </div>
            )}

            {file && isPdf && (
              <div className="relative w-full max-w-[900px]">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden pdf-page-shadow">
                  <canvas ref={pdfCanvasRef} className="w-full h-auto block" />
                </div>
                {report?.issues?.filter((i) => i.bbox).map((i) => (
                  <div
                    key={i.id}
                    className="hand-drawn-circle absolute pointer-events-none"
                    style={{
                      left: `${(i.bbox!.x ?? 0) * 100}%`,
                      top: `${(i.bbox!.y ?? 0) * 100}%`,
                      width: `${(i.bbox!.w ?? 0) * 100}%`,
                      height: `${(i.bbox!.h ?? 0) * 100}%`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[500px] xl:w-[550px] flex flex-col bg-white dark:bg-gray-800 shadow-2xl z-20 border-l border-slate-200 dark:border-slate-700">
          <div className="shrink-0 bg-white dark:bg-surface-dark p-6 border-b border-slate-100 dark:border-slate-700 shadow-sm relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 border-2 border-blue-200">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-300 text-4xl">
                    smart_toy
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 size-5 rounded-full border-2 border-white" />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">AI 안전도우미</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                    {loading ? "분석 중..." : report ? "분석 완료" : "대기 중"}
                  </span>
                  
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 dark:bg-[#1a2233]">
            <div className="flex justify-center">
              <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">오늘</span>
            </div>

            <div className="chat-message flex gap-3">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                <span className="material-symbols-outlined text-blue-600 text-xl">smart_toy</span>
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <span className="text-xs font-bold text-slate-500 ml-1">AI 안전도우미</span>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white whitespace-pre-line">
                  {report?.chat?.[0]?.text ??
                    "안녕하세요! 👋\n서류를 올려주시면 빠진 항목/불일치/수정사항을 찾아드릴게요."}
                </div>
              </div>
            </div>

            {report?.issues?.map((issue, idx) => (
              <div
                key={issue.id}
                className="chat-message flex gap-3"
                style={{ animationDelay: `${0.2 + idx * 0.2}s` }}
              >
                <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <span className="material-symbols-outlined text-blue-600 text-xl">smart_toy</span>
                </div>

                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div
                    className={`bg-white dark:bg-surface-dark p-4 rounded-2xl rounded-tl-none shadow-sm border-l-4 ${severityBorder(
                      issue.severity
                    )} text-slate-800 dark:text-white`}
                  >
                    <h4
                      className={`font-black text-lg mb-2 flex items-center gap-2 ${
                        issue.severity === "error"
                          ? "text-red-600"
                          : issue.severity === "warn"
                          ? "text-orange-600"
                          : "text-slate-600"
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {issue.severity === "error"
                          ? "edit_off"
                          : issue.severity === "warn"
                          ? "warning"
                          : "info"}
                      </span>
                      {issue.title}
                    </h4>

                    <p className="text-[16px] leading-relaxed mb-4 whitespace-pre-line">{issue.message}</p>

                    <div className="grid grid-cols-2 gap-2">
                      <button className="py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm">
                        확인했어
                      </button>
                      <button className="py-3 bg-primary hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-sm shadow-green-200">
                        수정해줘
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="h-4" />
          </div>

          <div className="p-6 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                className="flex flex-col items-center justify-center gap-1 p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 font-bold transition-all"
                onClick={pickFileDialog}
              >
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                <span>다시 업로드</span>
              </button>

              <button
                className="flex flex-col items-center justify-center gap-1 p-4 bg-primary hover:bg-green-600 rounded-2xl text-white font-bold shadow-lg shadow-green-200 transition-all"
                onClick={() => alert("여기에 저장/제출 로직 연결하면 돼!")}
              >
                <span className="material-symbols-outlined text-3xl">check_circle</span>
                <span>수정 완료</span>
              </button>
            </div>

            <div className="relative flex items-center gap-2">
              <input
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-3 px-5 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary"
                placeholder="메시지를 입력하세요..."
                type="text"
                disabled
              />
              <button className="p-3 bg-yellow-400 text-black rounded-full hover:bg-yellow-500 transition-colors shadow-sm absolute right-1">
                <span className="material-symbols-outlined block">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
