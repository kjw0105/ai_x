
"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import DocumentViewer from "@/components/viewer/DocumentViewer";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import ResizableSplitLayout from "@/components/layout/ResizableSplitLayout";
import HistorySidebar from "@/components/HistorySidebar";
import { Issue } from "@/lib/validator"; // Assumed shared type, might need fixing if validator.ts export is slightly different

// Type Definitions (Re-using some from validator or defining locally for now if implicit)
// In validator.ts we have type Severity? Checking previous read..
// validator.ts exported DocData and ValidationIssue.
// Let's create a local type for Report compatible with page state
type Report = {
  fileName: string;
  issues: any[]; // ValidationIssue[]
  chat: { role: "ai" | "user"; text: string }[];
};

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // PDF Worker Init (keep this here or move to a hook, keep here for simplicity)
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

  // --- File Logic ---
  useEffect(() => {
    if (!file) {
      setPageImages([]);
      return;
    }
    // Logic moved from old useEffect, actually renderPdfPages handles PDF
    // But for Image type we need this:
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPageImages([url]);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  function toggleDark() {
    document.documentElement.classList.toggle("dark");
  }

  function pickFileDialog() {
    fileInputRef.current?.click();
  }

  async function renderPdfPages(pdfFile: File) {
    const pdfjs = await getPdfjs();
    const buf = await pdfFile.arrayBuffer();
    const pdf = await (pdfjs as any).getDocument({ data: buf }).promise;

    const images: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      // Optimized scale for viewing
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      images.push(canvas.toDataURL("image/jpeg"));
    }
    setPageImages(images);
    return images;
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
      let images: string[] = [];

      if (f.type === "application/pdf") {
        images = await renderPdfPages(f);
        text = await extractPdfText(f);
      } else if (f.type.startsWith("image/")) {
        // Logic to get dataURL from file object for API
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
        images = [dataUrl];
      }

      // Token Opt: First + Last
      let imagesToSend: string[] = [];
      if (images.length > 0) {
        imagesToSend.push(images[0]);
        if (images.length > 1) {
          imagesToSend.push(images[images.length - 1]);
        }
      }

      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: f.name, pdfText: text, pageImages: imagesToSend })
      });

      const data = (await res.json()) as Report;
      if (!res.ok) {
        // Handle error response structure from API
        throw new Error((data as any).error || "Unknown server error");
      }
      setReport(data);
    } catch (e: any) {
      console.error(e);
      setReport({
        fileName: f.name,
        issues: [
          {
            id: "err",
            severity: "error",
            title: "검증 실패",
            message: e?.message || "오류가 발생했습니다."
          }
        ],
        chat: [{ role: "ai", text: `오류가 발생했어요: ${e?.message}` }]
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

  // History Load Logic
  async function loadReportFromHistory(id: string) {
    setLoading(true);
    setShowHistory(false); // Close sidebar
    try {
      const res = await fetch(`/api/history?id=${id}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();

      // Transform DB schema to UI schema
      // docDataJson and issuesJson are strings, need parsing
      const issues = JSON.parse(data.issuesJson);
      const extracted = JSON.parse(data.docDataJson);

      setReport({
        fileName: data.fileName,
        issues: issues,
        chat: [{ role: "ai", text: `Archive Loaded: ${data.fileName}\n(Note: Original images are not preserved in history)` }]
      });

      // We don't have the file, so clear it
      setFile(null);
      setPageImages([]);
    } catch (e) {
      alert("Failed to load history item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-gray-900 overflow-hidden relative">
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

      <Header
        loading={loading}
        reportExists={!!report}
        onUpload={pickFileDialog}
        onShowHistory={() => setShowHistory(true)}
        toggleDark={toggleDark}
      />

      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectReport={loadReportFromHistory}
      />

      <ResizableSplitLayout
        left={
          <DocumentViewer
            file={file}
            pageImages={pageImages}
            reportIssues={report?.issues ?? []}
            onPickFile={pickFileDialog}
          />
        }
        right={
          <AnalysisPanel
            loading={loading}
            issues={report?.issues ?? []}
            chatMessages={report?.chat ?? []}
            onReupload={pickFileDialog}
            onModify={() => alert("Coming soon!")}
          />
        }
      />
    </div>
  );
}
