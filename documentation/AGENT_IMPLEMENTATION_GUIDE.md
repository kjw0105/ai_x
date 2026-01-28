# Agent Implementation Guide - Smart Safety Guardian

**Purpose**: Detailed specifications for implementing remaining UI/UX features
**Target Agent**: Any coding AI agent with access to this codebase
**Context**: This is a Next.js 14 + Prisma + SQLite safety document validation system
**Current Status**: 5/18 features complete, 13 remaining

**Recently Completed** (as of 2026-01-28):
- ✅ Feature 4: Project Stats & Dashboard
- ✅ Feature 6: Project Edit Modal

---

## Table of Contents

1. [Project Context & Architecture](#project-context--architecture)
2. [Codebase Structure](#codebase-structure)
3. [Existing Patterns to Follow](#existing-patterns-to-follow)
4. [Feature Implementations](#feature-implementations)
5. [Testing Guidelines](#testing-guidelines)
6. [Deployment Checklist](#deployment-checklist)

---

## Project Context & Architecture

### What This System Does
- Validates Korean construction site safety documents
- Uses AI (OpenAI GPT-4o / Anthropic Claude) to extract data and check consistency
- Supports project-based validation with master safety plans
- 5-stage validation: Format → Logic → Cross-doc → Patterns → Risk

### Tech Stack
```
Frontend: Next.js 14 (App Router), React, Tailwind CSS
Backend: Next.js API Routes (Node.js runtime)
Database: SQLite (dev) / PostgreSQL (prod) via Prisma
AI: OpenAI API, Anthropic API
PDF: PDF.js
State: React hooks + idb-keyval for persistence
```

### Key Technologies
- **TypeScript**: Strict typing throughout
- **Tailwind CSS**: Utility-first styling with dark mode support
- **Material Symbols**: Icon library (Google Fonts)
- **Prisma ORM**: Type-safe database queries

### Current Schema (Prisma)
```prisma
model Report {
  id              String   @id @default(uuid())
  fileName        String
  createdAt       DateTime @default(now())
  docDataJson     String   // Extracted document data
  issuesJson      String   // Validation issues
  chatJson        String?  // AI chat messages
  score           Int?
  inspectorName   String?
  checklistJson   String?
  documentType    String?  // NEW: TBM, SAFETY_CHECKLIST, etc.
  tags            String?  // NEW: Comma-separated tags
  projectId       String?
  project         Project? @relation(fields: [projectId], references: [id])
}

model Project {
  id              String   @id @default(uuid())
  name            String
  description     String?
  createdAt       DateTime @default(now())
  contextText     String   @default("")
  masterPlanJson  String?
  planVersion     String?
  isStructured    Boolean  @default(false)
  reports         Report[]
}
```

---

## Codebase Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Providers
│   ├── page.tsx                # Main application page (CORE STATE)
│   ├── globals.css             # Tailwind + custom styles
│   └── api/
│       ├── validate/route.ts   # POST: AI validation endpoint
│       ├── projects/route.ts   # GET/POST: List/create projects
│       ├── projects/[id]/route.ts  # GET/DELETE: Single project ops
│       └── history/route.ts    # GET/DELETE: Validation history
├── components/
│   ├── Providers.tsx           # Context providers wrapper
│   ├── Toast.tsx               # Toast notification component
│   ├── ConfirmModal.tsx        # Confirmation dialog
│   ├── DocumentTypeBadge.tsx   # Document type badge
│   ├── DocumentTypeSelector.tsx # Document type selection modal
│   ├── WelcomeScreen.tsx       # First-time welcome screen
│   ├── Header.tsx              # Top navigation bar
│   ├── ProjectSelector.tsx     # Project dropdown
│   ├── HistorySidebar.tsx      # Right sidebar for history
│   ├── viewer/
│   │   └── DocumentViewer.tsx  # PDF/Image viewer (left pane)
│   ├── analysis/
│   │   └── AnalysisPanel.tsx   # AI analysis results (right pane)
│   └── layout/
│       └── ResizableSplitLayout.tsx  # Split pane container
├── contexts/
│   └── ToastContext.tsx        # Global toast notifications
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   ├── validator.ts            # Type definitions + rules
│   ├── documentTypes.ts        # Document type constants
│   └── [other validation libs]
└── prisma/
    ├── schema.prisma           # Database schema
    └── dev.db                  # SQLite database (dev)
```

### Critical Files for Implementation

**State Management Hub**: `src/app/page.tsx`
- Contains ALL main application state
- Manages: projects, current project, file upload, validation, history
- Connect all new features here

**API Routes**: `src/app/api/*/route.ts`
- Follow pattern: `export async function METHOD(req: Request) { ... }`
- Use `prisma` from `@/lib/db`
- Return `NextResponse.json(data)` or errors

**Toast System**: Use `useToast()` hook everywhere
```tsx
import { useToast } from "@/contexts/ToastContext";
const toast = useToast();
toast.success("Operation completed");
toast.error("Something went wrong");
```

---

## Existing Patterns to Follow

### 1. Component Pattern
```tsx
"use client"; // For client components with hooks/state

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";

interface MyComponentProps {
    onAction: () => void;
    data: SomeType;
}

export function MyComponent({ onAction, data }: MyComponentProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    async function handleAction() {
        setLoading(true);
        try {
            // Do something
            toast.success("Success message");
        } catch (error) {
            toast.error("Error message");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="...tailwind classes...">
            {/* Component JSX */}
        </div>
    );
}
```

### 2. API Route Pattern
```tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        // Do query
        const data = await prisma.model.findMany({ ... });

        return NextResponse.json(data);
    } catch (e: any) {
        console.error("Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
```

### 3. Modal Pattern
```tsx
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
}

export function MyModal({ isOpen, onClose, onConfirm }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                    Modal Title
                </h3>
                {/* Content */}
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="...">Cancel</button>
                    <button onClick={() => onConfirm(data)} className="...">Confirm</button>
                </div>
            </div>
        </div>
    );
}
```

### 4. Toast Usage Pattern
```tsx
// Success
toast.success("프로젝트가 생성되었습니다");

// Error
toast.error("작업에 실패했습니다");

// Warning
toast.warning("주의가 필요합니다");

// Info (with custom duration)
toast.info("곧 출시됩니다", 2000);
```

### 5. Dark Mode Styling
```tsx
// Always provide both light and dark classes
<div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
    <span className="text-slate-600 dark:text-slate-400">...</span>
</div>
```

### 6. Tailwind Color Scheme
```
Primary: green-500 (safety theme)
Error: red-500/600
Warning: orange-500/yellow-500
Info: blue-500
Success: green-500

Backgrounds:
  Light: white, slate-50, slate-100
  Dark: slate-800, slate-900, gray-800, gray-900

Borders:
  Light: slate-200, slate-300
  Dark: slate-700, slate-600
```

---

## Feature Implementations

### FEATURE 4: Project Stats & Dashboard ✅ COMPLETE

**Priority**: ⭐⭐⭐⭐⭐ (Essential for demo)
**Estimated Time**: 2-3 hours
**Complexity**: Medium
**Status**: ✅ Implemented (2026-01-28)

#### Requirements
- Calculate and display project statistics
- Show: total documents, average score, last activity, critical issues count
- Display in welcome screen and project detail view
- Use charts for visual appeal

#### Implementation Steps

**Step 1**: Create Stats API Endpoint

File: `src/app/api/projects/[id]/stats/route.ts`

```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id;

        // Get all reports for this project
        const reports = await prisma.report.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                createdAt: true,
                score: true,
                issuesJson: true,
                documentType: true,
            }
        });

        // Calculate statistics
        const totalDocuments = reports.length;
        const scoresArray = reports.map(r => r.score).filter(s => s !== null) as number[];
        const averageScore = scoresArray.length > 0
            ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length)
            : null;

        // Count critical issues
        let criticalIssuesCount = 0;
        reports.forEach(report => {
            try {
                const issues = JSON.parse(report.issuesJson);
                criticalIssuesCount += issues.filter((i: any) => i.severity === "error").length;
            } catch (e) {
                // Skip if JSON parsing fails
            }
        });

        // Last activity
        const lastActivity = reports[0]?.createdAt ?? null;

        // Group by document type
        const byDocType: Record<string, number> = {};
        reports.forEach(r => {
            const type = r.documentType ?? "OTHER";
            byDocType[type] = (byDocType[type] || 0) + 1;
        });

        // Recent trend (last 7 days vs previous 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const recentCount = reports.filter(r => new Date(r.createdAt) >= sevenDaysAgo).length;
        const previousCount = reports.filter(r =>
            new Date(r.createdAt) >= fourteenDaysAgo &&
            new Date(r.createdAt) < sevenDaysAgo
        ).length;

        const trend = previousCount > 0
            ? ((recentCount - previousCount) / previousCount * 100).toFixed(1)
            : null;

        return NextResponse.json({
            totalDocuments,
            averageScore,
            criticalIssuesCount,
            lastActivity,
            documentTypeBreakdown: byDocType,
            recentTrend: trend,
            recentScores: scoresArray.slice(0, 10).reverse(), // Last 10 scores for chart
        });
    } catch (e: any) {
        console.error("Error fetching stats:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
```

**Step 2**: Create ProjectStatsCard Component

File: `src/components/ProjectStatsCard.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";

interface ProjectStats {
    totalDocuments: number;
    averageScore: number | null;
    criticalIssuesCount: number;
    lastActivity: string | null;
    documentTypeBreakdown: Record<string, number>;
    recentTrend: string | null;
    recentScores: number[];
}

interface ProjectStatsCardProps {
    projectId: string;
}

export function ProjectStatsCard({ projectId }: ProjectStatsCardProps) {
    const [stats, setStats] = useState<ProjectStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch(`/api/projects/${projectId}/stats`);
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (e) {
                console.error("Failed to fetch stats:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [projectId]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">analytics</span>
                프로젝트 통계
            </h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Total Documents */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                        총 문서
                    </div>
                    <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
                        {stats.totalDocuments}
                    </div>
                    {stats.recentTrend && (
                        <div className={`text-xs font-medium mt-1 ${parseFloat(stats.recentTrend) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {parseFloat(stats.recentTrend) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(stats.recentTrend))}% (7일)
                        </div>
                    )}
                </div>

                {/* Average Score */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                        평균 점수
                    </div>
                    <div className="text-2xl font-black text-green-900 dark:text-green-100">
                        {stats.averageScore ?? "N/A"}
                    </div>
                    {stats.averageScore && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            / 100
                        </div>
                    )}
                </div>

                {/* Critical Issues */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                        심각한 문제
                    </div>
                    <div className="text-2xl font-black text-red-900 dark:text-red-100">
                        {stats.criticalIssuesCount}
                    </div>
                </div>

                {/* Last Activity */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                        최근 활동
                    </div>
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-100">
                        {stats.lastActivity
                            ? new Date(stats.lastActivity).toLocaleDateString('ko-KR')
                            : "없음"}
                    </div>
                </div>
            </div>

            {/* Document Type Breakdown */}
            {Object.keys(stats.documentTypeBreakdown).length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                        문서 유형별 분포
                    </div>
                    <div className="space-y-2">
                        {Object.entries(stats.documentTypeBreakdown).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between text-sm">
                                <span className="text-slate-700 dark:text-slate-300">{type}</span>
                                <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
```

**Step 3**: Integrate into WelcomeScreen

File: `src/components/WelcomeScreen.tsx`

Add after the recent projects list:

```typescript
import { ProjectStatsCard } from "./ProjectStatsCard";

// Inside the component, after projects list:
{projects.length > 0 && currentProjectId && (
    <div className="mt-6">
        <ProjectStatsCard projectId={currentProjectId} />
    </div>
)}
```

**Testing**:
1. Create a project with several documents
2. Verify stats appear in welcome screen
3. Check calculations are correct
4. Test with empty project
5. Verify dark mode styling

---

### FEATURE 5: PDF Export for Reports

**Priority**: ⭐⭐⭐⭐⭐ (Critical for demo)
**Estimated Time**: 2-3 hours
**Complexity**: Medium

#### Requirements
- Export validation report as professional PDF
- Include: document info, issues list, summary, branding
- Download with filename: `{projectName}_{fileName}_report.pdf`

#### Implementation Steps

**Step 1**: Install Dependencies

```bash
npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf
```

**Step 2**: Create PDF Export Utility

File: `src/lib/pdfExport.ts`

```typescript
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportData {
    fileName: string;
    projectName?: string;
    documentType?: string | null;
    createdAt: Date;
    issues: Array<{
        severity: string;
        title: string;
        message: string;
        ruleId?: string;
    }>;
    summary: {
        totalIssues: number;
        criticalCount: number;
        warningCount: number;
        infoCount: number;
    };
}

export function exportReportToPDF(data: ExportData) {
    const doc = new jsPDF();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("안전 점검 보고서", 105, yPosition, { align: "center" });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("스마트 안전지킴이", 105, yPosition, { align: "center" });
    yPosition += 15;

    // Document Info Box
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPosition, 180, 40, "F");
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`파일명: ${data.fileName}`, 20, yPosition);
    yPosition += 7;

    if (data.projectName) {
        doc.setFont("helvetica", "normal");
        doc.text(`프로젝트: ${data.projectName}`, 20, yPosition);
        yPosition += 7;
    }

    if (data.documentType) {
        doc.text(`문서 유형: ${data.documentType}`, 20, yPosition);
        yPosition += 7;
    }

    doc.text(`생성 날짜: ${data.createdAt.toLocaleString('ko-KR')}`, 20, yPosition);
    yPosition += 15;

    // Summary Statistics
    doc.setFillColor(34, 197, 94); // Green
    doc.rect(15, yPosition, 180, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("검증 요약", 20, yPosition + 6);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    const summaryData = [
        ["총 문제점", data.summary.totalIssues.toString()],
        ["심각한 문제", data.summary.criticalCount.toString()],
        ["경고", data.summary.warningCount.toString()],
        ["정보", data.summary.infoCount.toString()],
    ];

    autoTable(doc, {
        startY: yPosition,
        head: [["항목", "개수"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 15, right: 15 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Issues Table
    if (data.issues.length > 0) {
        doc.setFillColor(239, 68, 68); // Red
        doc.rect(15, yPosition, 180, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("발견된 문제점", 20, yPosition + 6);
        doc.setTextColor(0, 0, 0);
        yPosition += 15;

        const issuesData = data.issues.map((issue, idx) => [
            (idx + 1).toString(),
            getSeverityKorean(issue.severity),
            issue.title,
            issue.message,
        ]);

        autoTable(doc, {
            startY: yPosition,
            head: [["#", "심각도", "제목", "설명"]],
            body: issuesData,
            theme: "striped",
            headStyles: { fillColor: [239, 68, 68] },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 25 },
                2: { cellWidth: 50 },
                3: { cellWidth: 95 },
            },
            margin: { left: 15, right: 15 },
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            didParseCell: (data) => {
                // Color-code severity column
                if (data.column.index === 1 && data.section === "body") {
                    const severity = data.cell.raw as string;
                    if (severity === "심각") {
                        data.cell.styles.textColor = [239, 68, 68];
                        data.cell.styles.fontStyle = "bold";
                    } else if (severity === "경고") {
                        data.cell.styles.textColor = [251, 146, 60];
                        data.cell.styles.fontStyle = "bold";
                    }
                }
            },
        });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `페이지 ${i} / ${pageCount}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: "center" }
        );
        doc.text(
            "Generated by Smart Safety Guardian",
            105,
            doc.internal.pageSize.height - 5,
            { align: "center" }
        );
    }

    // Download
    const fileName = `${data.projectName ? data.projectName + "_" : ""}${data.fileName.replace(/\.[^/.]+$/, "")}_report.pdf`;
    doc.save(fileName);
}

function getSeverityKorean(severity: string): string {
    const map: Record<string, string> = {
        error: "심각",
        warn: "경고",
        info: "정보",
    };
    return map[severity] || severity;
}
```

**Step 3**: Add Export Button to AnalysisPanel

File: `src/components/analysis/AnalysisPanel.tsx`

Add import:
```typescript
import { exportReportToPDF } from "@/lib/pdfExport";
import { useToast } from "@/contexts/ToastContext";
```

Add handler function:
```typescript
const toast = useToast();

function handleExportPDF() {
    if (!currentFile) {
        toast.warning("먼저 문서를 업로드하세요");
        return;
    }

    try {
        const criticalCount = issues.filter(i => i.severity === "error").length;
        const warningCount = issues.filter(i => i.severity === "warn").length;
        const infoCount = issues.filter(i => i.severity === "info").length;

        exportReportToPDF({
            fileName: currentFile.name,
            projectName: currentProjectName,
            documentType: issues[0]?.documentType ?? null, // If you track this
            createdAt: new Date(),
            issues: issues.map(i => ({
                severity: i.severity,
                title: i.title,
                message: i.message,
                ruleId: i.ruleId,
            })),
            summary: {
                totalIssues: issues.length,
                criticalCount,
                warningCount,
                infoCount,
            },
        });

        toast.success("PDF 리포트가 다운로드되었습니다");
    } catch (error) {
        toast.error("PDF 생성에 실패했습니다");
        console.error("PDF export error:", error);
    }
}
```

Add button in the header section (after the "AI 안전도우미" title area):
```tsx
{reportExists && (
    <button
        onClick={handleExportPDF}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
    >
        <span className="material-symbols-outlined text-lg">download</span>
        <span>PDF 내보내기</span>
    </button>
)}
```

**Testing**:
1. Validate a document with issues
2. Click PDF export button
3. Verify PDF downloads with correct filename
4. Open PDF and check formatting
5. Test with various issue counts
6. Test with/without project context

---

### FEATURE 6: Project Edit Modal ✅ COMPLETE

**Priority**: ⭐⭐⭐⭐ (Important)
**Estimated Time**: 1-2 hours
**Complexity**: Low-Medium
**Status**: ✅ Implemented (2026-01-28)

#### Requirements
- Edit project name, description
- Replace master safety plan PDF
- PATCH endpoint for updates

#### Implementation Steps

**Step 1**: Add PATCH Endpoint

File: `src/app/api/projects/[id]/route.ts`

Add this function to the existing file:

```typescript
// PATCH: Update a project
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id;
        const { name, description, contextText } = await req.json();

        // Check if project exists
        const existing = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!existing) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Update project
        const updated = await prisma.project.update({
            where: { id: projectId },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(contextText !== undefined && { contextText }),
            }
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        console.error("Error updating project:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
```

**Step 2**: Create EditProjectModal Component

File: `src/components/EditProjectModal.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";

interface EditProjectModalProps {
    isOpen: boolean;
    project: {
        id: string;
        name: string;
        description: string;
    } | null;
    onClose: () => void;
    onUpdate: (id: string, data: any) => Promise<void>;
}

export function EditProjectModal({ isOpen, project, onClose, onUpdate }: EditProjectModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || "");
        }
    }, [project]);

    if (!isOpen || !project) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdate(project.id, { name, description, file });
            onClose();
        } catch (err) {
            console.error("Failed to update project:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">프로젝트 수정</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            프로젝트 이름
                        </label>
                        <input
                            required
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            설명
                        </label>
                        <input
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Master Safety Plan (PDF) - 선택사항
                        </label>
                        <input
                            type="file"
                            accept="application/pdf"
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            새 파일을 업로드하면 기존 계획서를 교체합니다
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "저장 중..." : "저장"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
```

**Step 3**: Integrate into Page and ProjectSelector

File: `src/app/page.tsx`

Add state:
```typescript
const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
const [editingProject, setEditingProject] = useState<{ id: string; name: string; description: string } | null>(null);
```

Add handler:
```typescript
async function handleUpdateProject(projectId: string, data: { name: string; description: string; file: File | null }) {
    try {
        let contextText = undefined;
        if (data.file) {
            contextText = await extractPdfText(data.file);
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

        setProjectSelectorKey(prev => prev + 1);
        toast.success("프로젝트가 업데이트되었습니다");
    } catch (error) {
        toast.error("프로젝트 업데이트에 실패했습니다");
        throw error;
    }
}

function handleOpenEditProject(project: { id: string; name: string; description: string }) {
    setEditingProject(project);
    setIsEditProjectModalOpen(true);
}
```

Add modal to JSX:
```tsx
<EditProjectModal
    isOpen={isEditProjectModalOpen}
    project={editingProject}
    onClose={() => {
        setIsEditProjectModalOpen(false);
        setEditingProject(null);
    }}
    onUpdate={handleUpdateProject}
/>
```

File: `src/components/ProjectSelector.tsx`

Add edit button next to delete button in the project list:
```tsx
<button
    onClick={(e) => {
        e.stopPropagation();
        onEditProject?.(p);
    }}
    className="flex-shrink-0 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
    title="프로젝트 수정"
>
    <span className="material-symbols-outlined text-lg">edit</span>
</button>
```

Update interface:
```typescript
interface ProjectSelectorProps {
    // ... existing props
    onEditProject?: (project: { id: string; name: string; description: string }) => void;
}
```

**Testing**:
1. Edit project name and description
2. Test with/without new master plan PDF
3. Verify changes persist
4. Test validation with updated context
5. Check error handling

---

### FEATURE 7: Breadcrumbs Navigation

**Priority**: ⭐⭐⭐ (Nice to have)
**Estimated Time**: 30 minutes
**Complexity**: Low

#### Requirements
- Show: Home → Project → Document in header
- Clickable breadcrumbs for navigation

#### Implementation Steps

**Step 1**: Create Breadcrumbs Component

File: `src/components/Breadcrumbs.tsx`

```typescript
"use client";

interface Breadcrumb {
    label: string;
    onClick?: () => void;
}

interface BreadcrumbsProps {
    items: Breadcrumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="flex items-center gap-2 text-sm">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    {item.onClick ? (
                        <button
                            onClick={item.onClick}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors"
                        >
                            {item.label}
                        </button>
                    ) : (
                        <span className="text-slate-900 dark:text-white font-bold">
                            {item.label}
                        </span>
                    )}
                    {index < items.length - 1 && (
                        <span className="material-symbols-outlined text-slate-400 text-base">
                            chevron_right
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
```

**Step 2**: Integrate into Header

File: `src/components/Header.tsx`

Add imports:
```typescript
import { Breadcrumbs } from "./Breadcrumbs";
```

Add props:
```typescript
interface HeaderProps {
    // ... existing props
    currentFileName?: string;
    onNavigateHome?: () => void;
}
```

Build breadcrumbs:
```typescript
const breadcrumbItems = [
    { label: "홈", onClick: onNavigateHome },
    ...(currentProjectName ? [{ label: currentProjectName }] : []),
    ...(currentFileName ? [{ label: currentFileName }] : []),
];
```

Add to JSX (after main title):
```tsx
<div className="mt-2">
    <Breadcrumbs items={breadcrumbItems} />
</div>
```

**Step 3**: Wire up in page.tsx

Pass props to Header:
```tsx
<Header
    // ... existing props
    currentFileName={file?.name}
    onNavigateHome={showWelcomeScreen}
/>
```

**Testing**:
1. Navigate through: Welcome → Project → Document
2. Click breadcrumbs to go back
3. Verify correct path shown
4. Test with/without project

---

### FEATURE 8: Drag & Drop Upload

**Priority**: ⭐⭐⭐⭐ (Great UX)
**Estimated Time**: 1-2 hours
**Complexity**: Medium

#### Requirements
- Drag PDF/images anywhere on page
- Show overlay with visual feedback
- Auto-trigger validation

#### Implementation Steps

**Step 1**: Create DragDropOverlay Component

File: `src/components/DragDropOverlay.tsx`

```typescript
"use client";

interface DragDropOverlayProps {
    isVisible: boolean;
}

export function DragDropOverlay({ isVisible }: DragDropOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-blue-500/20 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-12 border-4 border-dashed border-blue-500 max-w-md text-center">
                <div className="size-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-blue-600 dark:text-blue-400">
                        upload_file
                    </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                    파일을 여기에 놓으세요
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                    PDF 또는 이미지 파일을 지원합니다
                </p>
            </div>
        </div>
    );
}
```

**Step 2**: Add Drag Handlers to page.tsx

File: `src/app/page.tsx`

Add state:
```typescript
const [isDragging, setIsDragging] = useState(false);
```

Add drag handlers:
```typescript
useEffect(() => {
    let dragCounter = 0;

    function handleDragEnter(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter === 0) {
            setIsDragging(false);
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter = 0;

        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];

            // Check file type
            if (file.type === "application/pdf" || file.type.startsWith("image/")) {
                onPickFile(file);
            } else {
                toast.warning("PDF 또는 이미지 파일만 업로드할 수 있습니다");
            }
        }
    }

    // Add event listeners
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
        window.removeEventListener("dragenter", handleDragEnter);
        window.removeEventListener("dragleave", handleDragLeave);
        window.removeEventListener("dragover", handleDragOver);
        window.removeEventListener("drop", handleDrop);
    };
}, []);
```

Add overlay to JSX:
```tsx
import { DragDropOverlay } from "@/components/DragDropOverlay";

// In return:
<DragDropOverlay isVisible={isDragging} />
```

**Testing**:
1. Drag PDF from desktop
2. Verify overlay appears
3. Drop file and check validation starts
4. Test with non-PDF files (should reject)
5. Test multiple drag/drop cycles

---

### FEATURE 9: Upload Progress Indicator

**Priority**: ⭐⭐⭐⭐ (Professional)
**Estimated Time**: 1 hour
**Complexity**: Low-Medium

#### Requirements
- Show progress bar during validation
- Display steps: Extracting → Analyzing → Checking → Complete
- Replace simple loading spinner

#### Implementation Steps

**Step 1**: Create ProgressBar Component

File: `src/components/ProgressBar.tsx`

```typescript
"use client";

interface Step {
    id: string;
    label: string;
    icon: string;
}

interface ProgressBarProps {
    currentStep: number;
    steps: Step[];
}

export function ProgressBar({ currentStep, steps }: ProgressBarProps) {
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto p-6">
            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
            </div>

            {/* Steps */}
            <div className="flex justify-between items-center">
                {steps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                        <div
                            key={step.id}
                            className={`flex flex-col items-center gap-2 transition-all duration-300 ${
                                isActive ? "scale-110" : ""
                            }`}
                        >
                            <div
                                className={`size-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                    isCompleted
                                        ? "bg-green-500 border-green-500 text-white"
                                        : isActive
                                        ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                                        : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400"
                                }`}
                            >
                                {isCompleted ? (
                                    <span className="material-symbols-outlined">check</span>
                                ) : (
                                    <span className="material-symbols-outlined">{step.icon}</span>
                                )}
                            </div>
                            <span
                                className={`text-xs font-bold text-center ${
                                    isActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : isCompleted
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-slate-400"
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Percentage */}
            <div className="text-center mt-6">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {Math.round(progress)}%
                </span>
            </div>
        </div>
    );
}
```

**Step 2**: Add Progress State to page.tsx

File: `src/app/page.tsx`

Add state:
```typescript
const [validationStep, setValidationStep] = useState(0);
const [showProgress, setShowProgress] = useState(false);

const validationSteps = [
    { id: "extract", label: "텍스트 추출", icon: "description" },
    { id: "analyze", label: "AI 분석", icon: "psychology" },
    { id: "validate", label: "규칙 검증", icon: "task_alt" },
    { id: "complete", label: "완료", icon: "check_circle" },
];
```

Modify runValidation to update progress:
```typescript
async function runValidation(f: File, documentType: DocumentType | null = null) {
    setLoading(true);
    setShowProgress(true);
    setValidationStep(0);

    try {
        let text = "";
        let images: string[] = [];

        // Step 1: Extracting
        setValidationStep(0);
        if (f.type === "application/pdf") {
            images = await renderPdfPages(f);
            text = await extractPdfText(f);
        } else if (f.type.startsWith("image/")) {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(f);
            });
            images = [dataUrl];
        }

        // Step 2: Analyzing
        setValidationStep(1);
        let imagesToSend: string[] = [];
        if (images.length > 0) {
            imagesToSend.push(images[0]);
            if (images.length > 1) {
                imagesToSend.push(images[images.length - 1]);
            }
        }

        // Step 3: Validating
        setValidationStep(2);
        const res = await fetch("/api/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fileName: f.name,
                pdfText: text,
                pageImages: imagesToSend,
                projectId: currentProjectId,
                documentType: documentType,
            }),
        });

        const data = await res.json() as Report;
        if (!res.ok) {
            throw new Error((data as any).error || "Unknown server error");
        }

        // Step 4: Complete
        setValidationStep(3);
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause to show completion

        data.issues = data.issues.map((i: any) => ({ ...i, id: i.id || crypto.randomUUID() }));

        setReport({
            ...data,
            documentType: documentType,
        });
    } catch (e: any) {
        console.error(e);
        setReport({
            fileName: f.name,
            issues: [
                {
                    id: crypto.randomUUID(),
                    severity: "error",
                    title: "검증 실패",
                    message: e?.message || "오류가 발생했습니다.",
                },
            ],
            chat: [{ role: "ai", text: `오류가 발생했어요: ${e?.message}` }],
        });
    } finally {
        setLoading(false);
        setShowProgress(false);
    }
}
```

**Step 3**: Add Progress UI

Replace loading state in UI with progress indicator:

```tsx
{showProgress && (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
            <ProgressBar currentStep={validationStep} steps={validationSteps} />
        </div>
    </div>
)}
```

**Testing**:
1. Upload document and watch progress
2. Verify all 4 steps show correctly
3. Check percentage updates
4. Test with slow network
5. Verify completion animation

---

### FEATURE 10: Keyboard Shortcuts

**Priority**: ⭐⭐⭐ (Power user feature)
**Estimated Time**: 1-2 hours
**Complexity**: Medium

#### Requirements
- Ctrl/Cmd+U: Upload file
- Ctrl/Cmd+K: Quick project switcher
- ?: Show shortcuts help
- Esc: Close modals

#### Implementation Steps

**Step 1**: Create Keyboard Shortcuts Context

File: `src/contexts/KeyboardShortcutsContext.tsx`

```typescript
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface Shortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    description: string;
    action: () => void;
}

interface KeyboardShortcutsContextType {
    registerShortcut: (id: string, shortcut: Shortcut) => void;
    unregisterShortcut: (id: string) => void;
    showHelp: boolean;
    setShowHelp: (show: boolean) => void;
    shortcuts: Record<string, Shortcut>;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(
    undefined
);

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
    const [shortcuts, setShortcuts] = useState<Record<string, Shortcut>>({});
    const [showHelp, setShowHelp] = useState(false);

    const registerShortcut = (id: string, shortcut: Shortcut) => {
        setShortcuts((prev) => ({ ...prev, [id]: shortcut }));
    };

    const unregisterShortcut = (id: string) => {
        setShortcuts((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Show help with "?"
            if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setShowHelp(true);
                return;
            }

            // Close help with Escape
            if (e.key === "Escape" && showHelp) {
                setShowHelp(false);
                return;
            }

            // Check registered shortcuts
            for (const shortcut of Object.values(shortcuts)) {
                const ctrlOrMeta = e.ctrlKey || e.metaKey;
                const matchesCtrl = shortcut.ctrlKey === ctrlOrMeta;
                const matchesMeta = shortcut.metaKey === ctrlOrMeta;
                const matchesShift = shortcut.shiftKey === e.shiftKey;
                const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();

                if ((matchesCtrl || matchesMeta) && matchesShift && matchesKey) {
                    e.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [shortcuts, showHelp]);

    return (
        <KeyboardShortcutsContext.Provider
            value={{ registerShortcut, unregisterShortcut, showHelp, setShowHelp, shortcuts }}
        >
            {children}
        </KeyboardShortcutsContext.Provider>
    );
}

export function useKeyboardShortcuts() {
    const context = useContext(KeyboardShortcutsContext);
    if (!context) {
        throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider");
    }
    return context;
}
```

**Step 2**: Create Shortcuts Help Modal

File: `src/components/KeyboardShortcutsHelp.tsx`

```typescript
"use client";

import { useKeyboardShortcuts } from "@/contexts/KeyboardShortcutsContext";

export function KeyboardShortcutsHelp() {
    const { showHelp, setShowHelp, shortcuts } = useKeyboardShortcuts();

    if (!showHelp) return null;

    const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
    const modKey = isMac ? "⌘" : "Ctrl";

    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowHelp(false)}
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-3xl">keyboard</span>
                        키보드 단축키
                    </h3>
                    <button
                        onClick={() => setShowHelp(false)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-3">
                    {Object.entries(shortcuts).map(([id, shortcut]) => (
                        <div
                            key={id}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                        >
                            <span className="text-slate-700 dark:text-slate-300">
                                {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                                {(shortcut.ctrlKey || shortcut.metaKey) && (
                                    <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-sm font-mono">
                                        {modKey}
                                    </kbd>
                                )}
                                {shortcut.shiftKey && (
                                    <span className="text-slate-400">+</span>
                                )}
                                {shortcut.shiftKey && (
                                    <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-sm font-mono">
                                        Shift
                                    </kbd>
                                )}
                                {(shortcut.ctrlKey || shortcut.metaKey || shortcut.shiftKey) && (
                                    <span className="text-slate-400">+</span>
                                )}
                                <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-sm font-mono">
                                    {shortcut.key.toUpperCase()}
                                </kbd>
                            </div>
                        </div>
                    ))}

                    {/* Show help shortcut */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-blue-500">
                        <span className="text-slate-700 dark:text-slate-300 font-bold">
                            이 도움말 표시
                        </span>
                        <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-sm font-mono">
                            ?
                        </kbd>
                    </div>
                </div>

                <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">Esc</kbd>{" "}
                    키를 눌러 닫기
                </p>
            </div>
        </div>
    );
}
```

**Step 3**: Register Shortcuts in page.tsx

Add to Providers:
```typescript
// src/components/Providers.tsx
import { KeyboardShortcutsProvider } from "@/contexts/KeyboardShortcutsContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <KeyboardShortcutsProvider>
                {children}
            </KeyboardShortcutsProvider>
        </ToastProvider>
    );
}
```

In page.tsx, register shortcuts:
```typescript
import { useKeyboardShortcuts } from "@/contexts/KeyboardShortcutsContext";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";

// Inside component:
const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

useEffect(() => {
    registerShortcut("upload", {
        key: "u",
        ctrlKey: true,
        description: "파일 업로드",
        action: pickFileDialog,
    });

    registerShortcut("project-switch", {
        key: "k",
        ctrlKey: true,
        description: "프로젝트 전환",
        action: () => {
            // Open project selector or show welcome
            showWelcomeScreen();
        },
    });

    return () => {
        unregisterShortcut("upload");
        unregisterShortcut("project-switch");
    };
}, []);

// Add to JSX:
<KeyboardShortcutsHelp />
```

**Testing**:
1. Press ? to show help
2. Try Ctrl+U to upload
3. Try Ctrl+K for project switcher
4. Test on Mac (⌘) and Windows (Ctrl)
5. Verify shortcuts work globally

---

## REMAINING FEATURES (Quick Reference)

### Feature 11: Search & Filter History
- **Files**: `src/components/HistorySidebar.tsx`
- **Add**: Search input, filter by date/type
- **Time**: 1-2 hours

### Feature 12: Batch Upload
- **Files**: `src/app/page.tsx`, new `BatchUploadModal`
- **Add**: Multi-file input, queue management
- **Time**: 2-3 hours

### Feature 13: Issue Grouping
- **Files**: `src/components/analysis/AnalysisPanel.tsx`
- **Add**: Group by category, collapsible sections
- **Time**: 1 hour

### Feature 14: Project Archive
- **Files**: Schema, `/api/projects/[id]/route.ts`, UI
- **Add**: `archived` boolean, restore functionality
- **Time**: 1-2 hours

### Feature 15: Safety Score Charts
- **Dependencies**: `npm install recharts`
- **Files**: New `ProjectChartsCard`
- **Time**: 2-3 hours

### Feature 16: Mobile Optimizations
- **Files**: All components
- **Add**: FAB, swipe gestures, responsive layout
- **Time**: 3-4 hours

### Feature 17: Onboarding Tutorial
- **Files**: New `OnboardingTutorial` component
- **Add**: Step-by-step overlay guide
- **Time**: 2-3 hours

### Feature 18: Performance Optimizations
- **Files**: Multiple
- **Add**: Lazy loading, skeleton loaders, offline mode
- **Time**: 3-4 hours

---

## Testing Guidelines

### For Each Feature:

1. **Functional Testing**
   - Feature works as specified
   - Edge cases handled (empty states, errors)
   - Error messages are clear and in Korean

2. **UI/UX Testing**
   - Dark mode works correctly
   - Mobile responsive
   - Loading states present
   - Transitions smooth

3. **Integration Testing**
   - Works with existing features
   - Toast notifications fire correctly
   - State persists if needed

4. **Performance Testing**
   - No memory leaks
   - Fast rendering
   - No blocking operations

### Test Checklist Template:
```
Feature: [Name]
- [ ] Basic functionality works
- [ ] Error handling present
- [ ] Toast notifications integrated
- [ ] Dark mode compatible
- [ ] Mobile responsive
- [ ] Korean localization complete
- [ ] No console errors
- [ ] Works with existing features
```

---

## Deployment Checklist

Before deploying/demoing:

1. **Database**
   - [ ] Run `npx prisma db push`
   - [ ] Migrations applied
   - [ ] Sample data created

2. **Dependencies**
   - [ ] All packages installed
   - [ ] No version conflicts
   - [ ] Build passes: `npm run build`

3. **Environment**
   - [ ] API keys configured
   - [ ] Database URL set
   - [ ] Prod vs dev environment

4. **Testing**
   - [ ] All new features tested
   - [ ] No breaking changes to existing features
   - [ ] Cross-browser testing done

5. **Performance**
   - [ ] No memory leaks
   - [ ] Fast initial load
   - [ ] Optimized images

6. **Demo Prep**
   - [ ] Sample projects created
   - [ ] Sample documents ready
   - [ ] Common scenarios tested
   - [ ] Backup plan for API failures

---

## Tips for Implementation

### Best Practices
1. **Always add loading states** - Users need feedback
2. **Use toast notifications** - Replace all alerts
3. **Support dark mode** - Double-check all new components
4. **Keep it in Korean** - All user-facing text
5. **Follow existing patterns** - Look at implemented features
6. **Test incrementally** - Don't wait until the end

### Common Pitfalls
- Forgetting dark mode styles
- Not handling empty/error states
- Missing toast notifications
- Hardcoding English text
- Not testing mobile view
- Skipping TypeScript types

### Quick Debugging
```bash
# Clear Next.js cache
rm -rf .next

# Reset database
npx prisma db push --force-reset

# Check TypeScript errors
npx tsc --noEmit

# Lint code
npm run lint
```

---

## Contact & Support

If you get stuck:
1. Check `IMPLEMENTATION_PROGRESS.md` for context
2. Review existing similar features for patterns
3. Check git history: `git log --oneline`
4. Review this guide's examples

Key commits to reference:
- `d3ee2fe` - Toast system
- `68faf02` - Document categorization
- `7f21603` - Issue severity filter

---

**Document Version**: 1.0
**Last Updated**: January 28, 2026
**Total Features**: 15 remaining (4-18)
**Estimated Total Time**: 25-35 hours

Good luck with the implementation! 🚀
