"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Header from "@/components/Header";
import DocumentViewer from "@/components/viewer/DocumentViewer";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import ResizableSplitLayout from "@/components/layout/ResizableSplitLayout";
import { ThreeColumnLayout } from "@/components/layout/ThreeColumnLayout";
import { IssuesList } from "@/components/IssuesList";
import { ChatPanel } from "@/components/ChatPanel";
import HistorySidebar from "@/components/HistorySidebar";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { DocumentTypeSelector } from "@/components/DocumentTypeSelector";
import TBMRecorderModal from "@/components/TBMRecorderModal";
import { EditProjectModal } from "@/components/EditProjectModal";
import { ProjectDashboard } from "@/components/ProjectDashboard";
import { ProgressBar } from "@/components/ProgressBar";
import { TempMasterDocModal } from "@/components/TempMasterDocModal";
import { get, set, del } from "idb-keyval";
import { useToast } from "@/contexts/ToastContext";
import { DocumentType } from "@/lib/documentTypes";
import { ModalDialog } from "@/components/ModalDialog";
import { exportReportToPDF } from "@/lib/pdfExport";
import TBMResultModal from "@/components/TBMResultModal";

type Report = {
  fileName: string;
  issues: any[];
  chat: { role: "ai" | "user"; text: string }[];
  documentType?: string | null;
};

function NewProjectModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({ name, description, file });
      onClose();
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={descriptionId}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700"
      initialFocusRef={nameInputRef}
    >
      <h3 id={titleId} className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
        New Project
      </h3>
      <p id={descriptionId} className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Provide the project details below to create a new workspace.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Project Name
          </label>
          <input
            ref={nameInputRef}
            required
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gimpo Han River Site A"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <input
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            마스터 안전 계획서 (선택사항)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="application/pdf"
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">💡 이 문서는 무엇인가요?</p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              프로젝트의 <strong>안전 규칙 및 기준</strong>을 담은 PDF입니다. AI가 이 기준을 참고하여 제출된 점검 문서를 검증합니다.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
              ⚠️ 이 파일은 검증 대상이 아닙니다. 프로젝트 생성 후 별도로 점검 문서를 업로드하세요.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}

export default function Page() {
  const toast = useToast();

  // ✅ 업로드(파일 선택창)용 hidden input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ validate fetch abort
  const validationAbortController = useRef<AbortController | null>(null);

  // ✅ TBM 모달
  const [tbmOpen, setTbmOpen] = useState(false);
  const [tbmResultOpen, setTbmResultOpen] = useState(false);
  const [tbmResult, setTbmResult] = useState<any>(null);
  // Doc state
  const [file, setFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [historicalFileName, setHistoricalFileName] = useState<string | undefined>(undefined);
  const [currentReportId, setCurrentReportId] = useState<string | undefined>(undefined);

  // Doc type selector
  const [showDocTypeSelector, setShowDocTypeSelector] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);

  // Sidebars / modals
  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Temp master doc state (for non-project validation)
  const [tempMasterDoc, setTempMasterDoc] = useState<{ text: string; fileName: string } | null>(null);
  const [showTempMasterModal, setShowTempMasterModal] = useState(false);

  // Progress tracking state
  const [validationStep, setValidationStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  const validationSteps = [
    { id: "extract", label: "텍스트 추출", icon: "description" },
    { id: "analyze", label: "AI 분석", icon: "psychology" },
    { id: "validate", label: "규칙 검증", icon: "task_alt" },
    { id: "complete", label: "완료", icon: "check_circle" },
  ];

  // Project State
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; description: string } | null>(null);
  const [projectSelectorKey, setProjectSelectorKey] = useState(0);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Welcome screen state
  const [showWelcome, setShowWelcome] = useState(true);

  // Reset page when file/images changes
  useEffect(() => setCurrentPage(0), [file, pageImages]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => {
      if (validationAbortController.current) validationAbortController.current.abort();
    };
  }, []);

  // HYDRATION FIX: Load localStorage state in useEffect
  useEffect(() => {
    const savedProjectId = localStorage.getItem("current_project_id");
    if (savedProjectId) setCurrentProjectId(savedProjectId);

    async function loadTempMasterDoc() {
      try {
        const saved = await get("temp_master_doc");
        if (saved) setTempMasterDoc(saved);
      } catch (e) {
        console.error("Failed to load temp master doc", e);
      }
    }
    loadTempMasterDoc();

    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSelectorKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentProjectId) {
      localStorage.setItem("current_project_id", currentProjectId);
      if (tempMasterDoc) {
        setTempMasterDoc(null);
        del("temp_master_doc");
      }
    } else {
      localStorage.removeItem("current_project_id");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId]);

  // Preload font for PDF exports
  useEffect(() => {
    if (typeof window === "undefined") return;
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap";
    link.rel = "stylesheet";
    link.as = "style";
    document.head.appendChild(link);
  }, []);

  async function fetchProjects() {
    setIsLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch (e) {
      console.error("Failed to fetch projects", e);
    } finally {
      setIsLoadingProjects(false);
    }
  }

  // pdfjs
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

  // For image file immediate preview
  useEffect(() => {
    if (!file) {
      setPageImages([]);
      return;
    }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPageImages([url]);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  function toggleDark() {
    document.documentElement.classList.toggle("dark");
  }

  function dismissWelcome() {
    setShowWelcome(false);
  }

  function showWelcomeScreen() {
    setShowWelcome(true);
    handleClearFile();
  }

  function pickFileDialog() {
    fileInputRef.current?.click();
  }

  function startTBM() {
    console.log("[TBM] startTBM clicked");
    dismissWelcome();
    setTbmOpen(true);
  }

  async function renderPdfPages(pdfFile: File, signal: AbortSignal) {
    const pdfjs = await getPdfjs();
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    const buf = await pdfFile.arrayBuffer();
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    const pdf = await (pdfjs as any).getDocument({ data: buf }).promise;
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    const images: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
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

    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    setPageImages(images);
    return images;
  }

  async function extractPdfText(pdfFile: File, signal: AbortSignal) {
    const pdfjs = await getPdfjs();
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    const buf = await pdfFile.arrayBuffer();
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    const pdf = await (pdfjs as any).getDocument({ data: buf }).promise;
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");

    let full = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const pageText = content.items.map((it: any) => (typeof it.str === "string" ? it.str : "")).join(" ");
      full += `\n[PAGE ${p}]\n${pageText}\n`;
    }
    return full;
  }

  async function runValidation(f: File, documentType: DocumentType | null = null) {
    if (validationAbortController.current) validationAbortController.current.abort();

    const controller = new AbortController();
    validationAbortController.current = controller;
    const signal = controller.signal;

    setLoading(true);

    const startTime = Date.now();
    const minDisplayTime = 800;
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      let text = "";
      let images: string[] = [];

      if (f.type === "application/pdf") {
        images = await renderPdfPages(f, signal);
        text = await extractPdfText(f, signal);
      } else if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(f);
        });
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");
        images = [dataUrl];
      }

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      const hasText = text && text.trim().length >= 50;
      const hasImages = images && images.length > 0;
      if (!hasText && !hasImages) {
        if (!signal.aborted) {
          toast.error("문서에 내용이 없거나 읽을 수 없습니다");
          setFile(null);
          setReport(null);
          setShowProgress(false);
        }
        return;
      }

      setShowProgress(true);
      setValidationStep(0);
      await new Promise((r) => setTimeout(r, 300));

      setValidationStep(1);

      let imagesToSend: string[] = [];
      if (images.length > 0) {
        imagesToSend.push(images[0]);
        if (images.length > 1) imagesToSend.push(images[images.length - 1]);
      }

      await new Promise((r) => setTimeout(r, 500));

      setValidationStep(2);
      let progressValue = 2.0;
      progressInterval = setInterval(() => {
        progressValue += 0.05;
        if (progressValue < 2.9) setValidationStep(progressValue);
      }, 500);

      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: f.name,
          pdfText: text,
          pageImages: imagesToSend,
          projectId: currentProjectId,
          documentType: documentType,
          tempContextText: !currentProjectId && tempMasterDoc ? tempMasterDoc.text : undefined,
        }),
        signal,
      });

      if (progressInterval) clearInterval(progressInterval);

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      const data = (await res.json()) as Report;

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      if (!res.ok) {
        if (res.status === 400) {
          if (!signal.aborted) {
            toast.error((data as any).error || "문서 검증에 실패했습니다");
            setFile(null);
            setReport(null);
            setShowProgress(false);
          }
          return;
        }
        throw new Error((data as any).error || "서버 오류가 발생했습니다");
      }

      setValidationStep(3);

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      await new Promise((r) => setTimeout(r, remainingTime + 500));

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      data.issues = (data.issues ?? []).map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() }));

      setReport({ ...data, documentType: documentType });
    } catch (e: any) {
      if (progressInterval) clearInterval(progressInterval);
      if (e?.name === "AbortError") return;
      console.error(e);
      toast.error(e?.message || "문서 검증 중 오류가 발생했습니다");
      if (!signal.aborted) {
        setFile(null);
        setReport(null);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        setShowProgress(false);
      }
    }
  }

  async function onPickFile(f: File) {
    dismissWelcome();

    if (f.size === 0) {
      toast.error("빈 파일입니다. 내용이 있는 문서를 업로드해주세요");
      return;
    }

    setFile(f);
    setReport(null);
    setHistoricalFileName(undefined);

    setPendingFile(f);
    setShowDocTypeSelector(true);
  }

  async function handleDocTypeSelect(type: DocumentType) {
    setSelectedDocType(type);
    setShowDocTypeSelector(false);
    if (pendingFile) {
      await runValidation(pendingFile, type);
      setPendingFile(null);
    }
  }

  function handleDocTypeAutoDetect() {
    setShowDocTypeSelector(false);
    if (pendingFile) {
      runValidation(pendingFile, null);
      setPendingFile(null);
    }
  }

  async function loadReportFromHistory(id: string) {
    setLoading(true);
    setShowHistory(false);
    dismissWelcome();
    try {
      const res = await fetch(`/api/history?id=${id}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();

      let issues = JSON.parse(data.issuesJson);
      issues = issues.map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() }));

      const issueCount = issues.length;
      const criticalIssues = issues.filter((i: any) => i.severity === "error").length;
      const chatText = `검증 기록 불러오기 완료\n\n파일명: ${data.fileName}\n발견된 문제: ${issueCount}개\n심각한 문제: ${criticalIssues}개\n\n참고: 과거 기록은 원본 이미지가 보존되지 않습니다.`;

      setReport({
        fileName: data.fileName,
        issues,
        chat: [{ role: "ai", text: chatText }],
        documentType: data.documentType ?? null,
      });

      setFile(null);
      setPageImages([]);
      setHistoricalFileName(data.fileName);
      setCurrentReportId(id);
    } catch (e) {
      toast.error("기록을 불러오는 데 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function exportReportFromHistory(id: string) {
    setLoading(true);
    dismissWelcome();

    let exportData: {
      fileName: string;
      projectName?: string;
      documentType?: string | null;
      createdAt: string;
      issues: Array<{ severity: string; title: string; message: string; ruleId?: string }>;
      summary: { totalIssues: number; criticalCount: number; warningCount: number; infoCount: number };
    } | null = null;

    try {
      const res = await fetch(`/api/history?id=${id}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();

      let issues = JSON.parse(data.issuesJson);
      issues = issues.map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() }));

      exportData = {
        fileName: data.fileName,
        projectName: projects.find((p) => p.id === currentProjectId)?.name,
        documentType: data.documentType ?? null,
        createdAt: new Date(data.createdAt).toISOString(),
        issues: issues.map((i: any) => ({
          severity: i.severity,
          title: i.title,
          message: i.message,
          ruleId: i.ruleId,
        })),
        summary: {
          totalIssues: issues.length,
          criticalCount: issues.filter((i: any) => i.severity === "error").length,
          warningCount: issues.filter((i: any) => i.severity === "warn").length,
          infoCount: issues.filter((i: any) => i.severity === "info").length,
        },
      };

      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "report.pdf";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=["']?([^"';\n]*)["']?/);
        if (filenameMatch?.[1]) filename = decodeURIComponent(filenameMatch[1]);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF 리포트를 다시 다운로드했습니다");
    } catch (error: any) {
      try {
        if (!exportData) throw error;
        await exportReportToPDF({
          fileName: exportData.fileName,
          projectName: exportData.projectName,
          documentType: exportData.documentType ?? null,
          createdAt: new Date(exportData.createdAt),
          issues: exportData.issues.map((i) => ({
            severity: i.severity,
            title: i.title,
            message: i.message,
            ruleId: i.ruleId,
          })),
          summary: exportData.summary,
        });
        toast.success("브라우저에서 PDF를 생성했습니다");
      } catch (fallbackError: any) {
        toast.error(`PDF 재내보내기에 실패했습니다: ${fallbackError.message || "알 수 없는 오류"}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject({
    name,
    description,
    file,
  }: {
    name: string;
    description: string;
    file: File | null;
  }) {
    try {
      let contextText = "";
      if (file) {
        const controller = new AbortController();
        contextText = await extractPdfText(file, controller.signal);
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, contextText }),
      });

      if (!res.ok) throw new Error("Failed");

      const newProject = await res.json();
      setProjects((prev) => [...prev, newProject]);
      setCurrentProjectId(newProject.id);
      dismissWelcome();
    } catch (error) {
      toast.error("프로젝트 생성에 실패했습니다");
      throw error;
    }
  }

  async function handleDeleteProject(projectId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete project");
      }

      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setShowWelcome(true);
        handleClearFile();
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("프로젝트가 삭제되었습니다");
    } catch (error) {
      toast.error("프로젝트 삭제에 실패했습니다");
      throw error;
    }
  }

  async function handleUpdateProject(
    projectId: string,
    data: { name: string; description: string; file: File | null }
  ) {
    try {
      let contextText: string | undefined = undefined;
      if (data.file) {
        const controller = new AbortController();
        contextText = await extractPdfText(data.file, controller.signal);
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          ...(contextText !== undefined && { contextText }),
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updatedProject = await res.json();
      setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));
    } catch (error) {
      throw error;
    }
  }

  function handleOpenEditProject(project: { id: string; name: string; description: string }) {
    setEditingProject(project);
    setIsEditProjectModalOpen(true);
  }

  async function handleUploadTempMasterDoc(file: File) {
    try {
      const controller = new AbortController();
      const text = await extractPdfText(file, controller.signal);
      const tempDoc = { text, fileName: file.name };
      setTempMasterDoc(tempDoc);
      await set("temp_master_doc", tempDoc);
      toast.success(`임시 마스터 문서 "${file.name}"이(가) 업로드되었습니다`);
      setShowTempMasterModal(false);
    } catch (error) {
      console.error("Failed to upload temp master doc", error);
      toast.error("임시 마스터 문서 업로드에 실패했습니다");
    }
  }

  async function handleClearTempMasterDoc() {
    setTempMasterDoc(null);
    await del("temp_master_doc");
    toast.success("임시 마스터 문서가 삭제되었습니다");
  }

  function getProjectKey(key: string) {
    return currentProjectId ? `project_${currentProjectId}_${key}` : `no_project_${key}`;
  }

  function clearDocumentState() {
    setFile(null);
    setPageImages([]);
    setReport(null);
    setCurrentPage(0);
    setHistoricalFileName(undefined);
    setCurrentReportId(undefined);
  }

  async function loadCurrentProjectState() {
    try {
      const savedFile = await get(getProjectKey("file"));
      const savedImages = await get(getProjectKey("images"));
      const savedReport = await get(getProjectKey("report"));
      const savedPage = await get(getProjectKey("page"));

      if (savedFile || savedReport) {
        setFile(savedFile || null);
        setPageImages(savedImages || []);
        setReport(savedReport || null);
        setCurrentPage(savedPage || 0);
        setHistoricalFileName(undefined);
        setCurrentReportId(undefined);
      } else {
        clearDocumentState();
      }
    } catch (e) {
      console.error("Failed to load project state", e);
      clearDocumentState();
    }
  }

  useEffect(() => {
    loadCurrentProjectState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId, showWelcome]);

  useEffect(() => {
    if (file) set(getProjectKey("file"), file);
    else del(getProjectKey("file"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, currentProjectId]);

  useEffect(() => {
    if (pageImages.length > 0) set(getProjectKey("images"), pageImages);
    else del(getProjectKey("images"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageImages, currentProjectId]);

  useEffect(() => {
    if (report) set(getProjectKey("report"), report);
    else del(getProjectKey("report"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, currentProjectId]);

  useEffect(() => {
    if (currentPage > 0) set(getProjectKey("page"), currentPage);
    else del(getProjectKey("page"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, currentProjectId]);

  function handleClearFile() {
    clearDocumentState();
    del(getProjectKey("file"));
    del(getProjectKey("images"));
    del(getProjectKey("report"));
    del(getProjectKey("page"));
  }

  function handleWelcomeCreateProject() {
    dismissWelcome();
    setIsProjectModalOpen(true);
  }

  function handleWelcomeSelectProject(projectId: string) {
    dismissWelcome();
    setCurrentProjectId(projectId);
  }

  function handleWelcomeProceedWithoutProject() {
    dismissWelcome();
    setCurrentProjectId(null);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-slate-50 dark:bg-gray-900 relative">
      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        project={editingProject}
        onClose={() => {
          setIsEditProjectModalOpen(false);
          setEditingProject(null);
        }}
        onUpdate={handleUpdateProject}
      />

      <TempMasterDocModal
        isOpen={showTempMasterModal}
        onClose={() => setShowTempMasterModal(false)}
        onUpload={handleUploadTempMasterDoc}
        currentDoc={tempMasterDoc}
        onClear={handleClearTempMasterDoc}
      />

      <ProjectDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        projectId={currentProjectId}
        projectName={projects.find((p) => p.id === currentProjectId)?.name}
      />

      <DocumentTypeSelector
        isOpen={showDocTypeSelector}
        fileName={pendingFile?.name ?? ""}
        onSelect={handleDocTypeSelect}
        onAutoDetect={handleDocTypeAutoDetect}
      />

      {/* ✅ TBM 모달(반드시 tbmOpen으로 제어) */}
      <TBMRecorderModal
        open={tbmOpen}
        projectId={currentProjectId}
        onClose={() => setTbmOpen(false)}
        onComplete={(r) => {
          console.log("[TBM] onComplete fired", r);
          setTbmOpen(false);
          setTbmResult(r);
          dismissWelcome();
          setFile(null);
          setPageImages([]);
          setHistoricalFileName(undefined);
          setTbmResultOpen(true);
          setReport({
            fileName: "TBM(작업 전 대화)",
            issues: [],
            chat: [
              { role: "ai", text: r.summary || "(요약 결과가 비어있어요)" },
              ...(r.transcript ? [{ role: "ai" as const, text: `\n\n[전사본]\n${r.transcript}` }] : []),
            ],
            documentType: "TBM",
          });
        }}
      />
      <TBMResultModal
  open={tbmResultOpen}
  data={tbmResult}
  onClose={() => setTbmResultOpen(false)}
/>

      <Header
        key={projectSelectorKey}
        loading={loading}
        reportExists={!!report}
        isLoadingProjects={isLoadingProjects}
        onShowHistory={() => setShowHistory(true)}
        onShowDashboard={() => setShowDashboard(true)}
        toggleDark={toggleDark}
        showWelcome={showWelcome}
        projects={projects}
        currentProjectId={currentProjectId}
        onProjectChange={setCurrentProjectId}
        onOpenNewProject={() => setIsProjectModalOpen(true)}
        onDeleteProject={handleDeleteProject}
        onEditProject={handleOpenEditProject}
        onShowWelcome={showWelcomeScreen}
        currentFileName={file?.name}
        hasTempMasterDoc={!!tempMasterDoc}
        onOpenTempMasterDoc={() => setShowTempMasterModal(true)}
        onStartTBM={startTBM}
        // ✅ 업로드 버튼을 Header에서 없앴더라도, 혹시 남아있다면 연결 가능
        onUpload={pickFileDialog}
      />

      {/* Progress Modal */}
      {showProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-3xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 text-center">문서 검증 중...</h3>
            <ProgressBar currentStep={validationStep} steps={validationSteps} />
          </div>
        </div>
      )}

      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectReport={loadReportFromHistory}
        onExportReport={exportReportFromHistory}
        currentProjectId={currentProjectId}
      />

      {showWelcome ? (
        <WelcomeScreen
          projects={projects}
          isLoadingProjects={isLoadingProjects}
          onCreateProject={handleWelcomeCreateProject}
          onSelectProject={handleWelcomeSelectProject}
          onProceedWithoutProject={handleWelcomeProceedWithoutProject}
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:flex flex-1 min-h-0 w-full">
            {(file || report) ? (
              <ThreeColumnLayout
                left={<IssuesList issues={report?.issues ?? []} loading={loading} />}
                center={
                  <DocumentViewer
                    file={file}
                    pageImages={pageImages}
                    reportIssues={report?.issues ?? []}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onPickFile={pickFileDialog}
                    onFileSelect={onPickFile}
                    onStartTBM={startTBM}
                    onClearFile={handleClearFile}
                    historicalFileName={historicalFileName}
                    documentType={report?.documentType}
                    currentProjectId={currentProjectId}
                    currentReportId={currentReportId}
                    onLoadDocument={loadReportFromHistory}
                  />
                }
                right={
                  <ChatPanel
                    messages={report?.chat ?? []}
                    loading={loading}
                    currentProjectName={projects.find((p) => p.id === currentProjectId)?.name}
                    currentFile={file}
                    historicalFileName={historicalFileName}
                    issues={report?.issues ?? []}
                  />
                }
              />
            ) : (
              <div className="flex-1 overflow-hidden">
                <DocumentViewer
                  file={file}
                  pageImages={pageImages}
                  reportIssues={[]}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onPickFile={pickFileDialog}
                  onFileSelect={onPickFile}
                  onStartTBM={startTBM}
                  onClearFile={handleClearFile}
                  historicalFileName={historicalFileName}
                  documentType={null}
                  currentProjectId={currentProjectId}
                  currentReportId={currentReportId}
                  onLoadDocument={loadReportFromHistory}
                />
              </div>
            )}
          </div>

          {/* Mobile/Tablet */}
          <div className="flex lg:hidden flex-1 overflow-hidden">
            <ResizableSplitLayout
              initialLeftWidthPercent={70}
              left={
                <DocumentViewer
                  file={file}
                  pageImages={pageImages}
                  reportIssues={report?.issues ?? []}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onPickFile={pickFileDialog}
                  onFileSelect={onPickFile}
                  onStartTBM={startTBM}
                  onClearFile={handleClearFile}
                  historicalFileName={historicalFileName}
                  documentType={report?.documentType}
                  currentProjectId={currentProjectId}
                  currentReportId={currentReportId}
                  onLoadDocument={loadReportFromHistory}
                />
              }
              right={
                <AnalysisPanel
                  loading={loading}
                  issues={report?.issues ?? []}
                  chatMessages={report?.chat ?? []}
                  onReupload={pickFileDialog}
                  onModify={() => toast.info("수정 기능은 곧 출시됩니다", 2000)}
                  currentProjectName={projects.find((p) => p.id === currentProjectId)?.name}
                  currentFile={file}
                  historicalFileName={historicalFileName}
                />
              }
            />
          </div>
        </>
      )}

      {/* ✅ Hidden file input for upload (required) — 최상위 div 맨 아래에 둔다 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(f);
          // iOS에서 같은 파일 다시 선택 가능하게
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
