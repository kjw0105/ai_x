
"use client";

import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import DocumentViewer from "@/components/viewer/DocumentViewer";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import ResizableSplitLayout from "@/components/layout/ResizableSplitLayout";
import HistorySidebar from "@/components/HistorySidebar";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { Issue } from "@/lib/validator"; // Assumed shared type, might need fixing if validator.ts export is slightly different
import { get, set, del } from "idb-keyval";

// Type Definitions (Re-using some from validator or defining locally for now if implicit)
// In validator.ts we have type Severity? Checking previous read..
// validator.ts exported DocData and ValidationIssue.
// Let's create a local type for Report compatible with page state
type Report = {
  fileName: string;
  issues: any[]; // ValidationIssue[]
  chat: { role: "ai" | "user"; text: string }[];
};

// Simple Modal Component
function NewProjectModal({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (data: any) => Promise<void> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({ name, description, file });
      onClose();
    } catch (err) {
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">New Project</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Name</label>
            <input
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Gimpo Han River Site A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <input
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Master Safety Plan (PDF)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="application/pdf"
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Upload the safety manual to valid against context.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Reset page when file changes
  useEffect(() => {
    setCurrentPage(0);
  }, [file, pageImages]);

  // Project State
  const [projects, setProjects] = useState<any[]>([]); // Should use Project type
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectSelectorKey, setProjectSelectorKey] = useState(0); // To force refresh
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [projectSelectorKey]);

  // Load welcome screen preference
  useEffect(() => {
    const dismissed = localStorage.getItem("welcome_dismissed");
    if (dismissed === "true") {
      setShowWelcome(false);
    }
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch projects");
    }
  }

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
        body: JSON.stringify({
          fileName: f.name,
          pdfText: text,
          pageImages: imagesToSend,
          projectId: currentProjectId // Pass context
        })
      });

      const data = (await res.json()) as Report;
      if (!res.ok) {
        // Handle error response structure from API
        throw new Error((data as any).error || "Unknown server error");
      }

      // Ensure IDs exist (client-side patch for legacy/migration)
      data.issues = data.issues.map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() }));

      setReport(data);
    } catch (e: any) {
      console.error(e);
      setReport({
        fileName: f.name,
        issues: [
          {
            id: crypto.randomUUID(), // Ensure ID for fallback error too
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
    dismissWelcome(); // Dismiss welcome screen when file is uploaded
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
      let issues = JSON.parse(data.issuesJson);
      const extracted = JSON.parse(data.docDataJson);

      // Ensure IDs exist for history items
      issues = issues.map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() }));

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

  async function handleCreateProject({ name, description, file }: { name: string; description: string; file: File | null }) {
    let contextText = "";
    if (file) {
      // Extract text from Master Plan
      contextText = await extractPdfText(file);
    }

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, contextText })
    });

    if (!res.ok) throw new Error("Failed");

    const newProject = await res.json();
    setCurrentProjectId(newProject.id);
    setProjectSelectorKey(prev => prev + 1); // Refresh selector
  }

  async function handleDeleteProject(projectId: string) {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete project");
    }

    // If we deleted the current project, reset to null
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
    }

    // Refresh the project list
    setProjectSelectorKey(prev => prev + 1);
  }

  // --- Persistence Logic ---
  useEffect(() => {
    // Load state from DB on mount
    async function loadState() {
      try {
        const savedFile = await get("current_file");
        const savedImages = await get("current_images");
        const savedReport = await get("current_report");
        const savedPage = await get("current_page");

        if (savedFile) setFile(savedFile);
        if (savedImages) setPageImages(savedImages);
        if (savedReport) setReport(savedReport);
        if (savedPage) setCurrentPage(savedPage);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    loadState();
  }, []); // Run once on mount

  // Auto-save effects
  useEffect(() => {
    if (file) set("current_file", file);
  }, [file]);

  useEffect(() => {
    if (pageImages.length > 0) set("current_images", pageImages);
  }, [pageImages]);

  useEffect(() => {
    if (report) set("current_report", report);
  }, [report]);

  // Debounce page save slightly if needed, or just save (it's small)
  useEffect(() => {
    set("current_page", currentPage);
  }, [currentPage]);


  function handleClearFile() {
    setFile(null);
    setPageImages([]);
    setReport(null);
    setCurrentPage(0);

    // Clear DB
    del("current_file");
    del("current_images");
    del("current_report");
    del("current_page");
  }

  function dismissWelcome() {
    setShowWelcome(false);
    localStorage.setItem("welcome_dismissed", "true");
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
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-gray-900 overflow-hidden relative">
      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />
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
        key={projectSelectorKey}
        loading={loading}
        reportExists={!!report}
        onUpload={pickFileDialog}
        onShowHistory={() => setShowHistory(true)}
        toggleDark={toggleDark}
        projects={projects}
        currentProjectId={currentProjectId}
        onProjectChange={setCurrentProjectId}
        onOpenNewProject={() => setIsProjectModalOpen(true)}
        onDeleteProject={handleDeleteProject}
      />

      <HistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectReport={loadReportFromHistory}
      />

      {showWelcome && !file ? (
        <WelcomeScreen
          projects={projects}
          onCreateProject={handleWelcomeCreateProject}
          onSelectProject={handleWelcomeSelectProject}
          onProceedWithoutProject={handleWelcomeProceedWithoutProject}
        />
      ) : (
        <ResizableSplitLayout
        left={
          <DocumentViewer
            file={file}
            pageImages={pageImages}
            reportIssues={report?.issues ?? []}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPickFile={pickFileDialog}
            onClearFile={handleClearFile}
          />
        }
        right={
          <AnalysisPanel
            loading={loading}
            issues={report?.issues ?? []}
            chatMessages={report?.chat ?? []}
            onReupload={pickFileDialog}
            onModify={() => alert("Coming soon!")}
            currentProjectName={projects.find(p => p.id === currentProjectId)?.name}
            currentFile={file}
          />
        }
      />
      )}
    </div>
  );
}
