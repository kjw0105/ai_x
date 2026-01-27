// src/lib/crossDocumentAnalysis.ts
/**
 * Stage 3: Cross-Document Analysis System
 *
 * Purpose: Analyze multiple safety documents within a project to detect:
 * - Timeline gaps (missing daily inspections)
 * - Contradictions across documents (equipment status, work descriptions)
 * - Equipment and personnel tracking
 * - Suspicious repetition patterns
 */

import { prisma } from "@/lib/db";
import type { DocData, ValidationIssue } from "./validator";

export interface CrossDocumentIssue {
  type: "timeline_gap" | "contradiction" | "repetition" | "equipment_tracking";
  severity: "error" | "warning" | "info";
  messageKo: string;
  messageEn: string;
  relatedReportIds: string[];
  details?: any;
}

export interface TimelineAnalysis {
  totalReports: number;
  dateRange: { start: Date | null; end: Date | null };
  gaps: Array<{ start: Date; end: Date; daysMissing: number }>;
  frequency: "daily" | "weekly" | "irregular" | "unknown";
}

export interface ContradictionAnalysis {
  workDescriptions: Map<string, number>; // 작업내용 빈도
  riskLevels: Map<string, number>; // 위험도 빈도
  conflictingRiskLevels: boolean;
}

/**
 * 프로젝트 내 모든 문서를 분석하여 교차 문서 이슈를 탐지합니다.
 */
export async function analyzeCrossDocumentIssues(
  projectId: string,
  currentReportId?: string
): Promise<CrossDocumentIssue[]> {
  const issues: CrossDocumentIssue[] = [];

  // 프로젝트의 모든 보고서 가져오기 (최근 30일, 최대 100건)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const reports = await prisma.report.findMany({
    where: {
      projectId,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  if (reports.length < 2) {
    // 비교할 문서가 부족함
    return issues;
  }

  // 문서 데이터 파싱
  const parsedReports = reports.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    createdAt: r.createdAt,
    data: JSON.parse(r.docDataJson) as DocData,
  }));

  // 1. 타임라인 분석
  const timelineIssues = analyzeTimeline(parsedReports);
  issues.push(...timelineIssues);

  // 2. 모순 분석
  const contradictionIssues = analyzeContradictions(parsedReports);
  issues.push(...contradictionIssues);

  // 3. 반복 패턴 분석
  const repetitionIssues = analyzeRepetition(parsedReports);
  issues.push(...repetitionIssues);

  return issues;
}

/**
 * 타임라인 분석: 점검 일정의 공백 탐지
 */
function analyzeTimeline(
  reports: Array<{ id: string; createdAt: Date; data: DocData }>
): CrossDocumentIssue[] {
  const issues: CrossDocumentIssue[] = [];

  // 점검일자가 있는 보고서만 필터링
  const datedReports = reports
    .map((r) => {
      const dateStr = r.data.fields?.점검일자;
      if (!dateStr) return null;
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return { ...r, inspectionDate: date };
      } catch {
        return null;
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.inspectionDate.getTime() - b.inspectionDate.getTime());

  if (datedReports.length < 2) return issues;

  // 날짜 간격 분석
  for (let i = 1; i < datedReports.length; i++) {
    const prev = datedReports[i - 1];
    const curr = datedReports[i];
    const daysDiff = Math.floor(
      (curr.inspectionDate.getTime() - prev.inspectionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 5일 이상 공백이 있으면 경고
    if (daysDiff > 5) {
      issues.push({
        type: "timeline_gap",
        severity: daysDiff > 10 ? "warning" : "info",
        messageKo: `점검 기록 공백 발견: ${prev.data.fields?.점검일자} ~ ${curr.data.fields?.점검일자} (${daysDiff}일)`,
        messageEn: `Timeline gap detected: ${daysDiff} days between inspections`,
        relatedReportIds: [prev.id, curr.id],
        details: { daysMissing: daysDiff },
      });
    }
  }

  return issues;
}

/**
 * 모순 분석: 같은 현장/작업에 대한 상충되는 정보 탐지
 */
function analyzeContradictions(
  reports: Array<{ id: string; createdAt: Date; data: DocData }>
): CrossDocumentIssue[] {
  const issues: CrossDocumentIssue[] = [];

  // 같은 현장명을 가진 문서들 그룹화
  const siteGroups = new Map<string, typeof reports>();
  for (const report of reports) {
    const siteName = report.data.fields?.현장명;
    if (!siteName) continue;

    const normalized = siteName.trim().toLowerCase();
    if (!siteGroups.has(normalized)) {
      siteGroups.set(normalized, []);
    }
    siteGroups.get(normalized)!.push(report);
  }

  // 각 현장별로 위험도 일관성 검사
  for (const [siteName, siteReports] of siteGroups) {
    if (siteReports.length < 2) continue;

    const riskLevels = new Map<string, number>();
    const riskReports = new Map<string, string[]>();

    for (const report of siteReports) {
      const risk = report.data.riskLevel;
      if (!risk) continue;

      riskLevels.set(risk, (riskLevels.get(risk) || 0) + 1);
      if (!riskReports.has(risk)) riskReports.set(risk, []);
      riskReports.get(risk)!.push(report.id);
    }

    // 위험도가 2가지 이상이고, high/critical과 low가 섞여있으면 경고
    if (riskLevels.size >= 2) {
      const hasHighRisk = riskLevels.has("high") || riskLevels.has("critical");
      const hasLowRisk = riskLevels.has("low");

      if (hasHighRisk && hasLowRisk) {
        const allIds = Array.from(riskReports.values()).flat();
        issues.push({
          type: "contradiction",
          severity: "warning",
          messageKo: `같은 현장에서 상충되는 위험도 평가: ${Array.from(riskLevels.keys()).join(", ")}`,
          messageEn: `Conflicting risk assessments for same site: ${Array.from(riskLevels.keys()).join(", ")}`,
          relatedReportIds: allIds,
          details: { siteName, riskDistribution: Object.fromEntries(riskLevels) },
        });
      }
    }
  }

  // 같은 날짜에 서로 다른 작업내용이 기록된 경우
  const dateGroups = new Map<string, typeof reports>();
  for (const report of reports) {
    const date = report.data.fields?.점검일자;
    if (!date) continue;

    if (!dateGroups.has(date)) {
      dateGroups.set(date, []);
    }
    dateGroups.get(date)!.push(report);
  }

  for (const [date, dateReports] of dateGroups) {
    if (dateReports.length < 2) continue;

    const workDescriptions = new Set<string>();
    for (const report of dateReports) {
      const work = report.data.fields?.작업내용?.trim();
      if (work) workDescriptions.add(work);
    }

    // 같은 날 2개 이상의 서로 다른 작업이 기록되면 정보성 메시지
    if (workDescriptions.size > 1) {
      issues.push({
        type: "contradiction",
        severity: "info",
        messageKo: `${date}에 ${workDescriptions.size}개의 서로 다른 작업 기록됨`,
        messageEn: `${workDescriptions.size} different work activities recorded on ${date}`,
        relatedReportIds: dateReports.map((r) => r.id),
        details: { date, workDescriptions: Array.from(workDescriptions) },
      });
    }
  }

  return issues;
}

/**
 * 반복 패턴 분석: 의심스러운 복사-붙여넣기 감지
 */
function analyzeRepetition(
  reports: Array<{ id: string; createdAt: Date; data: DocData }>
): CrossDocumentIssue[] {
  const issues: CrossDocumentIssue[] = [];

  // 작업내용 빈도 분석
  const workDescriptions = new Map<string, { count: number; reportIds: string[] }>();

  for (const report of reports) {
    const work = report.data.fields?.작업내용?.trim();
    if (!work || work.length < 5) continue; // 너무 짧은 설명은 제외

    const normalized = work.toLowerCase().replace(/\s+/g, " ");
    if (!workDescriptions.has(normalized)) {
      workDescriptions.set(normalized, { count: 0, reportIds: [] });
    }
    const entry = workDescriptions.get(normalized)!;
    entry.count++;
    entry.reportIds.push(report.id);
  }

  // 4번 이상 반복된 작업내용이 있으면 경고
  for (const [work, { count, reportIds }] of workDescriptions) {
    if (count >= 4) {
      issues.push({
        type: "repetition",
        severity: count >= 6 ? "warning" : "info",
        messageKo: `동일한 작업내용이 ${count}회 반복됨: "${work.substring(0, 50)}${work.length > 50 ? "..." : ""}"`,
        messageEn: `Same work description repeated ${count} times`,
        relatedReportIds: reportIds,
        details: { repetitionCount: count, text: work },
      });
    }
  }

  // 체크리스트 패턴 반복 분석 (같은 체크 패턴)
  const checklistPatterns = new Map<string, { count: number; reportIds: string[] }>();

  for (const report of reports) {
    const checklist = report.data.checklist;
    if (!checklist || checklist.length === 0) continue;

    // 체크리스트를 문자열로 변환 (예: "fall_01:✔,ppe_03:✖,fire_01:N/A")
    const pattern = checklist
      .map((item) => `${item.id}:${item.value}`)
      .sort()
      .join(",");

    if (!checklistPatterns.has(pattern)) {
      checklistPatterns.set(pattern, { count: 0, reportIds: [] });
    }
    const entry = checklistPatterns.get(pattern)!;
    entry.count++;
    entry.reportIds.push(report.id);
  }

  // 5번 이상 동일한 체크리스트 패턴이 반복되면 경고
  for (const [pattern, { count, reportIds }] of checklistPatterns) {
    if (count >= 5) {
      issues.push({
        type: "repetition",
        severity: "warning",
        messageKo: `동일한 체크리스트 패턴이 ${count}회 반복됨 (복사 가능성)`,
        messageEn: `Identical checklist pattern repeated ${count} times (possible copy-paste)`,
        relatedReportIds: reportIds,
        details: { repetitionCount: count },
      });
    }
  }

  return issues;
}

/**
 * CrossDocumentIssue를 ValidationIssue 형식으로 변환
 */
export function crossDocumentIssuesToValidationIssues(
  crossIssues: CrossDocumentIssue[]
): ValidationIssue[] {
  return crossIssues.map((issue) => ({
    ruleId: `cross_doc_${issue.type}`,
    severity: issue.severity === "error" ? "error" : issue.severity === "warning" ? "warning" : "info",
    message: issue.messageKo,
    fieldKo: "문서 간 분석",
    fieldEn: "Cross-Document Analysis",
  }));
}

/**
 * 프로젝트 전체 타임라인 요약 정보
 */
export async function getProjectTimelineSummary(projectId: string): Promise<TimelineAnalysis> {
  const reports = await prisma.report.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const dates: Date[] = [];

  for (const report of reports) {
    try {
      const data = JSON.parse(report.docDataJson) as DocData;
      const dateStr = data.fields?.점검일자;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          dates.push(date);
        }
      }
    } catch {
      // Skip invalid data
    }
  }

  if (dates.length === 0) {
    return {
      totalReports: reports.length,
      dateRange: { start: null, end: null },
      gaps: [],
      frequency: "unknown",
    };
  }

  dates.sort((a, b) => a.getTime() - b.getTime());

  // 날짜 간격 분석
  const gaps: TimelineAnalysis["gaps"] = [];
  for (let i = 1; i < dates.length; i++) {
    const daysDiff = Math.floor(
      (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 5) {
      gaps.push({
        start: dates[i - 1],
        end: dates[i],
        daysMissing: daysDiff,
      });
    }
  }

  // 점검 빈도 추정
  const avgInterval = dates.length > 1
    ? (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24) / (dates.length - 1)
    : 0;

  let frequency: TimelineAnalysis["frequency"] = "unknown";
  if (avgInterval <= 2) frequency = "daily";
  else if (avgInterval <= 8) frequency = "weekly";
  else frequency = "irregular";

  return {
    totalReports: reports.length,
    dateRange: { start: dates[0], end: dates[dates.length - 1] },
    gaps,
    frequency,
  };
}
