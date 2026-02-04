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
import { ImageQualityCard, type ImageQuality } from "@/components/ImageQualityCard";
import { ErrorDialog } from "@/components/ErrorDialog";
import { ErrorMessages, type ErrorDetails, formatErrorMessage } from "@/lib/errorMessages";
import { optimizeImage } from "@/lib/imageOptimizer";
import { get, set, del } from "idb-keyval";
import { calculateRiskLevel, riskCalculationToIssues } from "@/lib/riskMatrix";
import { analyzeCrossDocumentIssues, crossDocumentIssuesToValidationIssues } from "@/lib/crossDocumentAnalysis";
import { parseDocExtraction } from "@/lib/docSchema";
import { TEMPLATE_METADATA, TEMPLATES } from "@/lib/masterPlanTemplates";
import { useToast } from "@/contexts/ToastContext";
import { DocumentType } from "@/lib/documentTypes";
import { ModalDialog } from "@/components/ModalDialog";
import { exportReportToPDF } from "@/lib/pdfExport";
import TBMResultModal from "@/components/TBMResultModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Report = {
  fileName: string;
  issues: any[];
  chat: { role: "ai" | "user"; text: string }[];
  documentType?: string | null;

  // ✅ TBM 전용: PDF export/AI 재분석에서 쓰기 좋게 별도 필드로 보관
  // ✅ TBM 전용: PDF export/AI 재분석에서 쓰기 좋게 별도 필드로 보관
  tbmSummary?: string;
  tbmTranscript?: string;
};

interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line
  onCreate: (data: { name: string; description: string; file: File | null; templateId?: string }) => Promise<void>;
}

function NewProjectModal({ isOpen, onClose, onCreate }: ModalDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("general_construction");
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
      await onCreate({ name, description, file, templateId: selectedTemplateId });
      onClose();
      setName("");
      setDescription("");
      setFile(null);
      setSelectedTemplateId("general_construction");
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
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl border border-slate-200 dark:border-slate-700"
      initialFocusRef={nameInputRef}
    >
      <div className="mb-6">
        <h3 id={titleId} className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          새 프로젝트 생성
        </h3>
        <p id={descriptionId} className="text-slate-600 dark:text-slate-300">
          안전 검증을 위한 새로운 프로젝트를 설정합니다. 현장 특성에 맞는 안전 기준을 선택하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Project Details */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                프로젝트 정보
              </label>
              <div className="space-y-4">
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 font-medium text-lg"
                  placeholder="프로젝트 이름 입력"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="프로젝트 설명 (선택사항)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                마스터 안전 계획서 (PDF) <span className="text-slate-400 font-normal">- 선택사항</span>
              </label>
              <div className={`p-4 rounded-xl border border-dashed transition-colors ${file
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                : "bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 hover:border-blue-500"
                }`}>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    {file ? (
                      <>
                        <span className="material-symbols-outlined text-3xl text-blue-500 mb-2">assignment_turned_in</span>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{file.name}</span>
                        <span className="text-xs text-blue-500 mt-1">클릭하여 변경</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="absolute top-1 right-1 p-1.5 text-blue-400 hover:text-red-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full transition-colors z-10"
                          title="파일 제거"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-3xl text-slate-400 mb-2">upload_file</span>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">PDF 파일 업로드</span>
                        <span className="text-xs text-slate-400 mt-1">여기를 클릭하거나 파일을 드래그하세요</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Site Type Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              현장 유형 및 안전 기준
            </label>

            {/* Template Grid */}
            <div className={`grid grid-cols-2 gap-3 transition-opacity ${file ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {TEMPLATE_METADATA.map((t) => {
                const isSelected = selectedTemplateId === t.id && !file;
                let icon = "construction";
                if (t.id === "high_rise") icon = "location_city";
                if (t.id === "infrastructure") icon = "engineering";
                if (t.id === "interior_renovation") icon = "design_services";

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setFile(null); // Deselect file if clicking a template
                    }}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center group h-32 ${isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500 shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800"
                      }`}
                  >
                    <div className={`p-2 rounded-lg mb-2 transition-colors ${isSelected
                      ? "bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600"
                      }`}>
                      <span className="material-symbols-outlined text-3xl">{icon}</span>
                    </div>

                    <div className="font-bold text-slate-900 dark:text-white leading-tight text-sm">
                      {t.name.split('(')[0].trim()}
                    </div>

                    {isSelected && (
                      <div className="absolute top-2 right-2 text-blue-500">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Template Description Box */}
            {!file && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold block mb-1 text-slate-900 dark:text-white">
                  {TEMPLATE_METADATA.find(t => t.id === selectedTemplateId)?.name}
                </span>
                {TEMPLATE_METADATA.find(t => t.id === selectedTemplateId)?.description}
              </div>
            )}

            {/* PDF Upload Override Message */}
            {file && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-lg shrink-0">upload_file</span>
                <div>
                  <span className="font-bold block mb-0.5">PDF 마스터 플랜 사용 중</span>
                  업로드된 "{file.name}" 문서를 기준으로 안전 검증을 수행합니다. 템플릿 선택은 무시됩니다.
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                    }}
                    className="block mt-1.5 text-blue-600 underline hover:text-blue-800 font-bold"
                  >
                    업로드 취소하고 템플릿 사용하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                생성 중...
              </span>
            ) : "프로젝트 생성"}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}

export default function Page() {
  const toast = useToast();
  const [latestTBM, setLatestTBM] = useState<{ summary: string; transcript: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPickingRef = useRef(false);
  const [tbmMode, setTbmMode] = useState<"record" | "upload">("record");

  const validationAbortController = useRef<AbortController | null>(null);

  const [tbmOpen, setTbmOpen] = useState(false);
  const [tbmResultOpen, setTbmResultOpen] = useState(false);
  const [tbmResult, setTbmResult] = useState<any>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [historicalFileName, setHistoricalFileName] = useState<string | undefined>(undefined);
  const [currentReportId, setCurrentReportId] = useState<string | undefined>(undefined);

  const [showDocTypeSelector, setShowDocTypeSelector] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const [tempMasterDoc, setTempMasterDoc] = useState<{ text: string; fileName: string } | null>(null);
  const [showTempMasterModal, setShowTempMasterModal] = useState(false);

  const [validationStep, setValidationStep] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [imageQuality, setImageQuality] = useState<ImageQuality | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ error: ErrorDetails; onRetry?: () => void } | null>(null);

  const validationSteps = [
    { id: "stage1", label: "형식 검증", icon: "description" },
    { id: "stage2", label: "논리 검증", icon: "rule" },
    { id: "stage3", label: "교차 분석", icon: "compare_arrows" },
    { id: "stage4", label: "패턴 감지", icon: "analytics" },
    { id: "stage5", label: "위험 평가", icon: "shield" },
  ];

  const [projects, setProjects] = useState<any[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; description: string } | null>(null);
  const [projectSelectorKey, setProjectSelectorKey] = useState(0);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [showWelcome, setShowWelcome] = useState(true);

  // Confirmation dialog states
  const [confirmClearFile, setConfirmClearFile] = useState(false);
  const [confirmProjectSwitch, setConfirmProjectSwitch] = useState<{ projectId: string | null } | null>(null);

  useEffect(() => setCurrentPage(0), [file, pageImages]);

  useEffect(() => {
    return () => {
      if (validationAbortController.current) validationAbortController.current.abort();
    };
  }, []);

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

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
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

  function pickFileDialog(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();

    if (isPickingRef.current) return;
    isPickingRef.current = true;

    fileInputRef.current?.click();

    setTimeout(() => {
      isPickingRef.current = false;
    }, 5000);
  }

  const pdfjsPromiseRef = useRef<Promise<any> | null>(null);
  async function getPdfjs() {
    if (!pdfjsPromiseRef.current) {
      pdfjsPromiseRef.current = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
        (pdfjs as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        return pdfjs;
      });
    }
    return pdfjsPromiseRef.current;
  }

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

  function showError(error: ErrorDetails, onRetry?: () => void) {
    setErrorDialog({ error, onRetry });
  }

  async function hasMicInput() {
    const ds = await navigator.mediaDevices.enumerateDevices();
    return ds.some((d) => d.kind === "audioinput");
  }

  function startTBM(initialMode: "record" | "upload" = "record") {
    console.log("[TBM] startTBM clicked", initialMode);
    dismissWelcome();
    setTbmMode(initialMode);
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
      // Reduced scale from 1.5 to 1.0 for lower initial size
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      // ✅ Optimize image to reduce token usage
      try {
        const optimized = await optimizeImage(dataUrl, 2048, 0.85);
        images.push(optimized.dataUrl);
      } catch (e) {
        console.warn("Failed to optimize PDF page, using original", e);
        images.push(dataUrl);
      }
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
      const pageText = content.items
        .map((it: any) => (typeof it.str === "string" ? it.str : ""))
        .join(" ");
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
    setShowProgress(true);
    setValidationStep(0);

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
        // ✅ Basic image validation
        if (f.size < 10000) {
          // Less than 10KB is suspiciously small
          if (!signal.aborted) {
            showError(ErrorMessages.IMAGE_TOO_SMALL(), () => pickFileDialog());
            setFile(null);
            setShowProgress(false);
          }
          return;
        }

        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(f);
        });
        if (signal.aborted) throw new DOMException("Aborted", "AbortError");

        // ✅ Check image dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataUrl;
        });

        if (img.width < 400 || img.height < 400) {
          if (!signal.aborted) {
            showError(ErrorMessages.IMAGE_LOW_RESOLUTION(img.width, img.height), () => pickFileDialog());
            setFile(null);
            setShowProgress(false);
          }
          return;
        }

        console.log(`[Image] Validated: ${img.width}x${img.height}, ${(f.size / 1024).toFixed(1)}KB`);

        // ✅ Optimize image to reduce token usage
        try {
          const optimized = await optimizeImage(dataUrl, 2048, 0.85);
          images = [optimized.dataUrl];
          console.log(`[Image] Optimized: ${optimized.width}x${optimized.height}, saved ${((1 - optimized.compressionRatio) * 100).toFixed(1)}%`);
        } catch (e) {
          console.warn("Failed to optimize image, using original", e);
          images = [dataUrl];
        }
      }

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      const hasText = text && text.trim().length >= 50;
      const hasImages = images && images.length > 0;
      if (!hasText && !hasImages) {
        if (!signal.aborted) {
          showError(ErrorMessages.EMPTY_DOCUMENT(), () => pickFileDialog());
          setFile(null);
          setReport(null);
          setShowProgress(false);
        }
        return;
      }

      // Stage 1: 형식 검증 (Format validation)
      await new Promise((r) => setTimeout(r, 200));
      setValidationStep(1);
      console.log("[Validation] Stage 1/5 - Format validation");

      let imagesToSend: string[] = [];
      if (images.length > 0) {
        imagesToSend.push(images[0]);
        if (images.length > 1) imagesToSend.push(images[images.length - 1]);
      }

      // Stage 2: 논리 검증 (Logic validation)
      await new Promise((r) => setTimeout(r, 300));
      setValidationStep(2);
      console.log("[Validation] Stage 2/5 - Logic validation");

      // Stage 3: 교차 분석 (Cross-document analysis)
      await new Promise((r) => setTimeout(r, 400));
      setValidationStep(3);
      console.log("[Validation] Stage 3/5 - Cross-document analysis");

      // Stage 4: 패턴 감지 (Pattern detection) - animate during API call
      await new Promise((r) => setTimeout(r, 300));
      console.log("[Validation] Stage 4/5 - Pattern detection (animating...)");
      let progressValue = 3.0;
      progressInterval = setInterval(() => {
        progressValue += 0.15;
        if (progressValue < 4.8) {
          setValidationStep(Math.min(progressValue, 4.5));
        }
      }, 400);

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

      // Clear animation interval before processing response
      if (progressInterval) clearInterval(progressInterval);

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      const data = (await res.json()) as Report;
      if (latestTBM?.summary) {
        const first = data.chat?.[0]?.text || "";
        const merged = `${first}\n\n[TBM 요약]\n${latestTBM.summary}`.trim();

        data.chat = [
          { role: "ai", text: merged },
          ...(data.chat?.slice(1) ?? []),
        ];

        data.tbmSummary = latestTBM.summary;
        data.tbmTranscript = latestTBM.transcript || "";
      }
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      if (!res.ok) {
        if (res.status === 400) {
          if (!signal.aborted) {
            const errorMsg = (data as any).error || "문서 검증에 실패했습니다";
            // Check if it's a "not a safety document" error
            if (errorMsg.includes("안전") || errorMsg.includes("문서")) {
              showError(ErrorMessages.NOT_SAFETY_DOCUMENT(), () => pickFileDialog());
            } else {
              showError(ErrorMessages.VALIDATION_FAILED(errorMsg), () => {
                if (f) runValidation(f, documentType);
              });
            }
            setFile(null);
            setReport(null);
            setShowProgress(false);
          }
          return;
        }
        throw new Error((data as any).error || "서버 오류가 발생했습니다");
      }

      // Stage 5: 위험 평가 (Risk assessment complete)
      setValidationStep(4);
      console.log("[Validation] Stage 5/5 complete - Risk assessment done");

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      await new Promise((r) => setTimeout(r, remainingTime + 200));

      if (signal.aborted) throw new DOMException("Aborted", "AbortError");

      data.issues = (data.issues ?? []).map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() }));

      // ✅ 일반 문서 리포트: TBM 필드는 비움
      setReport({ ...data, documentType: documentType, tbmSummary: undefined, tbmTranscript: undefined });

      // Brief pause to show 100% completion before hiding progress
      await new Promise((r) => setTimeout(r, 300));
    } catch (e: any) {
      if (progressInterval) clearInterval(progressInterval);
      if (e?.name === "AbortError") return;
      console.error(e);
      if (!signal.aborted) {
        showError(ErrorMessages.VALIDATION_ERROR(e?.message), () => {
          if (f) runValidation(f, documentType);
        });
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

  async function analyzeImageQuality(file: File): Promise<ImageQuality> {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    const width = img.width;
    const height = img.height;
    const fileSize = file.size;
    const megapixels = (width * height) / 1_000_000;

    let quality: ImageQuality["quality"];
    const issues: string[] = [];
    const tips: string[] = [];

    // Determine quality level
    if (width >= 1920 && height >= 1080 && fileSize >= 100_000) {
      quality = "excellent";
      tips.push("이미지 품질이 우수합니다. 검증을 진행하세요.");
    } else if (width >= 1280 && height >= 720 && fileSize >= 50_000) {
      quality = "good";
      tips.push("이미지 품질이 양호합니다.");
    } else if (width >= 800 && height >= 600 && fileSize >= 30_000) {
      quality = "fair";
      issues.push("해상도가 다소 낮습니다. 더 선명한 사진을 권장합니다.");
      tips.push("밝은 조명에서 다시 촬영해보세요.");
      tips.push("카메라를 문서에 가까이 대고 촬영하세요.");
    } else {
      quality = "poor";
      issues.push("해상도가 매우 낮습니다 (" + width + "×" + height + ")");
      tips.push("최소 800×600 이상의 해상도로 촬영하세요.");
      tips.push("밝은 조명에서 문서 전체가 보이도록 촬영하세요.");
      tips.push("손떨림 방지를 위해 안정된 자세로 촬영하세요.");
    }

    // Check file size
    if (fileSize < 10_000) {
      quality = "poor";
      issues.push("파일 크기가 너무 작습니다 (" + (fileSize / 1024).toFixed(1) + "KB)");
      tips.push("원본 사진을 압축하지 말고 업로드하세요.");
    } else if (fileSize > 10_000_000) {
      issues.push("파일 크기가 매우 큽니다 (" + (fileSize / 1024 / 1024).toFixed(1) + "MB)");
      tips.push("업로드 시간이 오래 걸릴 수 있습니다.");
    }

    // Check aspect ratio (documents should be roughly rectangular)
    const aspectRatio = width / height;
    if (aspectRatio < 0.5 || aspectRatio > 2.5) {
      issues.push("비정상적인 가로세로 비율입니다. 문서 전체가 잘 보이는지 확인하세요.");
    }

    // Check megapixels
    if (megapixels < 0.5) {
      issues.push("이미지 해상도가 낮아 텍스트 인식이 어려울 수 있습니다.");
    }

    console.log(`[Image Quality] ${width}×${height}, ${(fileSize / 1024).toFixed(1)}KB, ${megapixels.toFixed(1)}MP → ${quality}`);

    return {
      resolution: { width, height },
      fileSize,
      quality,
      issues,
      tips,
    };
  }

  async function onPickFile(f: File) {
    dismissWelcome();

    if (f.size === 0) {
      showError(ErrorMessages.EMPTY_FILE(), () => pickFileDialog());
      return;
    }

    setFile(f);
    setReport(null);
    setHistoricalFileName(undefined);

    // Analyze image quality for images
    if (f.type.startsWith("image/")) {
      try {
        const quality = await analyzeImageQuality(f);
        setImageQuality(quality);

        // Warn about poor quality images
        if (quality.quality === "poor") {
          toast.warning("⚠️ 이미지 품질이 불량합니다. 검증 결과가 부정확할 수 있습니다.");
          // Still allow proceeding with validation, but show warning
        }
      } catch (error) {
        console.error("Image quality analysis failed:", error);
        // Continue anyway
      }
    } else {
      // Reset image quality for PDFs
      setImageQuality(null);
    }

    // Auto-start validation for images (Photo Audit)
    if (f.type.startsWith("image/")) {
      setFile(f);
      await runValidation(f, "SITE_PHOTO");
      return;
    }

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

  async function saveTBMHistory(r: any) {
    try {
      const resp = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TBM",
          projectId: currentProjectId,
          fileName: "TBM(작업 전 대화)",
          transcript: r?.transcript ?? "",
          summary: r?.summary ?? "",
        }),
      });
      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        console.warn("[TBM] history save failed:", resp.status, t);
      } else {
        setProjectSelectorKey((k) => k + 1);
      }
    } catch (e) {
      console.warn("[TBM] history save error:", e);
    }
  }

  function isTBMHistoryRecord(data: any) {
    const dt = (data?.documentType ?? "") as string;
    const t = (data?.type ?? "") as string;
    return dt === "TBM" || t === "TBM";
  }

  async function loadReportFromHistory(id: string) {
    setLoading(true);
    setShowHistory(false);
    dismissWelcome();
    try {
      const res = await fetch(`/api/history?id=${id}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();

      // ✅ TBM이면: 요약/전사 표시
      if (isTBMHistoryRecord(data)) {
        const tbmSummary = data.tbmSummary || data.summary || "";
        const tbmTranscript = data.tbmTranscript || data.transcript || "";

        setReport({
          fileName: data.fileName ?? "TBM(작업 전 대화)",
          issues: [],
          chat: [
            { role: "ai", text: tbmSummary || "(요약 결과가 비어있어요)" },
            ...(tbmTranscript
              ? [{ role: "ai" as const, text: `\n\n[전사본]\n${tbmTranscript}` }]
              : []),
          ],
          documentType: "TBM",
          tbmSummary,
          tbmTranscript,
        });

        setFile(null);
        setPageImages([]);
        setHistoricalFileName(data.fileName ?? "TBM(작업 전 대화)");
        setCurrentReportId(id);
        return;
      }


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
        tbmSummary: undefined,
        tbmTranscript: undefined,
      });

      setFile(null);
      setPageImages([]);
      setHistoricalFileName(data.fileName);
      setCurrentReportId(id);
    } catch (e) {
      showError(ErrorMessages.LOAD_HISTORY_FAILED(), () => loadReportFromHistory(id));
    } finally {
      setLoading(false);
    }
  }

  async function exportReportFromHistory(id: string) {
    setLoading(true);
    dismissWelcome();

    let exportData: any = null;

    try {
      const res = await fetch(`/api/history?id=${id}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();

      if (isTBMHistoryRecord(data)) {
        exportData = {
          fileName: data.fileName ?? "TBM(작업 전 대화)",
          projectName: projects.find((p) => p.id === currentProjectId)?.name,
          documentType: "TBM",
          createdAt: new Date(data.createdAt ?? Date.now()).toISOString(),
          issues: [],
          summary: { totalIssues: 0, criticalCount: 0, warningCount: 0, infoCount: 0 },
          projectId: currentProjectId,
          tbmSummary: data.tbmSummary || data.summary || "",
          tbmTranscript: data.tbmTranscript || data.transcript || "",
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

        toast.success("TBM PDF를 다시 다운로드했습니다");
        return;
      }

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
        tbmSummary: report?.tbmSummary || "",
        tbmTranscript: report?.tbmTranscript || "",

        summary: {
          totalIssues: issues.length,
          criticalCount: issues.filter((i: any) => i.severity === "error").length,
          warningCount: issues.filter((i: any) => i.severity === "warn").length,
          infoCount: issues.filter((i: any) => i.severity === "info").length,
        },
        projectId: currentProjectId,
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

        if (exportData.documentType === "TBM") {
          throw new Error("TBM 브라우저 PDF fallback은 아직 지원되지 않습니다 (서버 export 필요)");
        }

        await exportReportToPDF({
          fileName: exportData.fileName,
          projectName: exportData.projectName,
          documentType: exportData.documentType ?? null,
          createdAt: new Date(exportData.createdAt),
          issues: exportData.issues.map((i: any) => ({
            severity: i.severity,
            title: i.title,
            message: i.message,
            ruleId: i.ruleId,
          })),
          summary: exportData.summary,
        } as any);

        toast.success("브라우저에서 PDF를 생성했습니다");
      } catch (fallbackError: any) {
        showError(ErrorMessages.PDF_EXPORT_FAILED(fallbackError.message), () => exportReportFromHistory(id));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject({
    name,
    description,
    file,
    templateId,
  }: {
    name: string;
    description: string;
    file: File | null;
    templateId?: string;
  }) {
    try {
      let contextText = "";
      if (file) {
        const controller = new AbortController();
        contextText = await extractPdfText(file, controller.signal);
      }

      let masterPlanJson: string | null = null;
      let isStructured = false;

      if (templateId && TEMPLATES[templateId]) {
        // Use the selected template
        masterPlanJson = JSON.stringify(TEMPLATES[templateId]);
        isStructured = true;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          contextText,
          masterPlanJson,
          isStructured
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const newProject = await res.json();
      setProjects((prev) => [newProject, ...prev]);
      setCurrentProjectId(newProject.id);
      dismissWelcome();
    } catch (error) {
      showError(ErrorMessages.PROJECT_CREATE_FAILED());
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

      const projectToDelete = projects.find((p) => p.id === projectId);
      const projectName = projectToDelete ? projectToDelete.name : "프로젝트";

      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
        setShowWelcome(true);
        handleClearFile();
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success(`"${projectName}" 프로젝트가 삭제되었습니다`);
    } catch (error) {
      showError(ErrorMessages.PROJECT_DELETE_FAILED());
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
      showError(ErrorMessages.TEMP_MASTER_DOC_UPLOAD_FAILED());
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
    setImageQuality(null);
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
    // Show confirmation if file exists
    if (file) {
      setConfirmClearFile(true);
      return;
    }
    performClearFile();
  }

  function performClearFile() {
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

  function handleProjectChange(projectId: string | null) {
    // Show confirmation if switching projects with unsaved work
    if (file && projectId !== currentProjectId) {
      setConfirmProjectSwitch({ projectId });
      return;
    }
    performProjectChange(projectId);
  }

  function performProjectChange(projectId: string | null) {
    if (showWelcome) {
      dismissWelcome();
    }
    setCurrentProjectId(projectId);
  }

  return (
    <div className="flex flex-col h-dvh bg-slate-50 dark:bg-gray-900 relative overflow-hidden">
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

      <TBMRecorderModal
        open={tbmOpen}
        mode={tbmMode}
        projectId={currentProjectId}
        onClose={() => setTbmOpen(false)}
        onComplete={async (r) => {
          await saveTBMHistory(r);

          const tbmSummary = r.summary || "";
          const tbmTranscript = r.transcript || "";
          setLatestTBM({ summary: r.summary || "", transcript: r.transcript || "" }); // ✅ 추가
          setTbmOpen(false);
          setTbmResult(r);
          dismissWelcome();
          setFile(null);
          setPageImages([]);
          // ✅ Set historicalFileName so DocumentViewer knows there's content
          setHistoricalFileName("TBM(작업 전 대화)");
          setTbmResultOpen(true);

          setReport({
            fileName: "TBM(작업 전 대화)",
            issues: [],
            chat: [
              { role: "ai", text: tbmSummary || "(요약 결과가 비어있어요)" },
              ...(tbmTranscript ? [{ role: "ai" as const, text: `\n\n[전사본]\n${tbmTranscript}` }] : []),
            ],
            documentType: "TBM",
            tbmSummary,
            tbmTranscript,
          });
        }}

      />

      <TBMResultModal open={tbmResultOpen} data={tbmResult} onClose={() => setTbmResultOpen(false)} />

      <ConfirmDialog
        isOpen={confirmClearFile}
        onClose={() => setConfirmClearFile(false)}
        onConfirm={performClearFile}
        title="파일 삭제 확인"
        message={`현재 업로드된 파일 "${file?.name}"을(를) 삭제하시겠습니까?\n\n검증 결과와 분석 내용이 모두 사라집니다.`}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmProjectSwitch}
        onClose={() => setConfirmProjectSwitch(null)}
        onConfirm={() => {
          if (confirmProjectSwitch) {
            performProjectChange(confirmProjectSwitch.projectId);
            setConfirmProjectSwitch(null);
          }
        }}
        title="프로젝트 전환 확인"
        message={`현재 작업 중인 파일이 있습니다.\n프로젝트를 전환하시겠습니까?\n\n현재 파일: ${file?.name}\n\n프로젝트를 전환하면 현재 작업 내용이 저장되지 않을 수 있습니다.`}
        confirmText="전환"
        cancelText="취소"
        variant="warning"
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
        onProjectChange={handleProjectChange}
        onOpenNewProject={() => setIsProjectModalOpen(true)}
        onDeleteProject={handleDeleteProject}
        onEditProject={handleOpenEditProject}
        onShowWelcome={showWelcomeScreen}
        currentFileName={file?.name}
        hasTempMasterDoc={!!tempMasterDoc}
        onOpenTempMasterDoc={() => setShowTempMasterModal(true)}
        onStartTBM={startTBM}
        onUpload={pickFileDialog}
      />

      {showProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-3xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 text-center">
              문서 검증 중...
            </h3>
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
          <div className="hidden lg:flex flex-1 min-h-0 w-full">
            {file || report ? (
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
                    tbmSummary={report?.tbmSummary}
                    tbmTranscript={report?.tbmTranscript}
                    imageQuality={imageQuality}
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
                    tbmSummary={report?.tbmSummary ?? ""}
                    tbmTranscript={report?.tbmTranscript ?? ""}
                    documentType={report?.documentType ?? null}
                    reportContext={report ? {
                      docType: (report as any).docType,
                      fields: (report as any).fields,
                      signature: (report as any).signature,
                      inspectorName: (report as any).inspectorName,
                      riskLevel: (report as any).riskLevel,
                      checklist: (report as any).checklist,
                      issues: report.issues,
                    } : null}
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
                  tbmSummary={undefined}
                  tbmTranscript={undefined}
                  imageQuality={imageQuality}
                />
              </div>
            )}
          </div>

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
                  tbmSummary={report?.tbmSummary}
                  tbmTranscript={report?.tbmTranscript}
                  imageQuality={imageQuality}
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
                  tbmSummary={report?.tbmSummary || ""}
                  tbmTranscript={report?.tbmTranscript || ""}
                  validationStep={validationStep}
                  showProgress={showProgress}
                />
              }
            />
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(f);
          e.currentTarget.value = "";
          isPickingRef.current = false;
        }}
      />

      {/* Error Dialog */}
      {errorDialog && (
        <ErrorDialog
          error={errorDialog.error}
          onClose={() => setErrorDialog(null)}
          onRetry={errorDialog.onRetry}
        />
      )}
      {/* Project Dashboard Modal */}
      <ProjectDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        projectId={currentProjectId}
        projectName={projects.find((p) => p.id === currentProjectId)?.name}
        onOpenNewProject={() => {
          setShowDashboard(false);
          setIsProjectModalOpen(true);
        }}
      />
    </div>
  );
}
