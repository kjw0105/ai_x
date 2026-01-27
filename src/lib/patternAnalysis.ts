/**
 * Stage 4: Behavioral Pattern Analysis
 * Detects suspicious patterns across multiple documents
 */

import { prisma } from "./db";
import type { ValidationIssue, ChecklistItem } from "./validator";

export interface PatternWarning {
    type: "always_check" | "copy_paste" | "rapid_completion";
    severity: "warn" | "info";
    title: string;
    message: string;
    inspectorName: string;
    documentCount: number;
}

/**
 * Detect suspicious patterns for a given inspector
 */
export async function analyzeInspectorPatterns(
    inspectorName: string,
    projectId?: string
): Promise<PatternWarning[]> {
    const warnings: PatternWarning[] = [];

    if (!inspectorName) return warnings;

    // Query recent reports by this inspector
    const recentReports = await prisma.report.findMany({
        where: {
            inspectorName: inspectorName,
            ...(projectId ? { projectId } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 20, // Look at last 20 reports
        select: {
            id: true,
            createdAt: true,
            checklistJson: true,
            docDataJson: true,
        },
    });

    if (recentReports.length < 5) {
        // Not enough data for pattern analysis
        return warnings;
    }

    // Check for "always ✔" pattern
    const alwaysCheckPattern = detectAlwaysCheckPattern(recentReports);
    if (alwaysCheckPattern) {
        warnings.push(alwaysCheckPattern);
    }

    // Check for copy-paste behavior
    const copyPastePattern = detectCopyPastePattern(recentReports);
    if (copyPastePattern) {
        warnings.push(copyPastePattern);
    }

    // Check for rapid completion pattern (many reports in short time)
    const rapidPattern = detectRapidCompletionPattern(recentReports);
    if (rapidPattern) {
        warnings.push(rapidPattern);
    }

    return warnings;
}

interface ReportData {
    id: string;
    createdAt: Date;
    checklistJson: string | null;
    docDataJson: string;
}

/**
 * Detect if inspector checks everything as ✔ in >95% of items
 */
function detectAlwaysCheckPattern(reports: ReportData[]): PatternWarning | null {
    let totalItems = 0;
    let checkedItems = 0;

    for (const report of reports) {
        if (!report.checklistJson) continue;

        try {
            const checklist: ChecklistItem[] = JSON.parse(report.checklistJson);
            for (const item of checklist) {
                if (item.value !== null && item.value !== "N/A") {
                    totalItems++;
                    if (item.value === "✔") {
                        checkedItems++;
                    }
                }
            }
        } catch {
            // Skip invalid JSON
        }
    }

    if (totalItems < 50) return null; // Not enough data

    const checkRate = checkedItems / totalItems;
    if (checkRate > 0.95) {
        return {
            type: "always_check",
            severity: "warn",
            title: "패턴 경고: 일관된 전체 체크",
            message: `이 점검자는 최근 ${reports.length}건의 보고서에서 ${Math.round(checkRate * 100)}%의 항목을 ✔로 표시했습니다. 실제 점검 수행 여부를 확인하세요.`,
            inspectorName: "",
            documentCount: reports.length,
        };
    }

    return null;
}

/**
 * Detect copy-paste behavior (identical work descriptions across dates)
 */
function detectCopyPastePattern(reports: ReportData[]): PatternWarning | null {
    const descriptions: Map<string, number> = new Map();

    for (const report of reports) {
        try {
            const docData = JSON.parse(report.docDataJson);
            const workDesc = docData.fields?.작업내용?.trim();
            if (workDesc && workDesc.length > 10) {
                descriptions.set(workDesc, (descriptions.get(workDesc) || 0) + 1);
            }
        } catch {
            // Skip invalid JSON
        }
    }

    // Find descriptions that appear more than 3 times
    for (const [desc, count] of descriptions) {
        if (count >= 3) {
            return {
                type: "copy_paste",
                severity: "warn",
                title: "패턴 경고: 동일 작업내용 반복",
                message: `"${desc.substring(0, 30)}..." 작업내용이 ${count}건의 서류에서 동일하게 기재되었습니다. 복사-붙여넣기 가능성을 확인하세요.`,
                inspectorName: "",
                documentCount: count,
            };
        }
    }

    return null;
}

/**
 * Detect rapid completion (many reports created in a short time)
 */
function detectRapidCompletionPattern(reports: ReportData[]): PatternWarning | null {
    if (reports.length < 5) return null;

    // Check if 5+ reports were created within 30 minutes
    const sortedReports = [...reports].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    for (let i = 0; i < sortedReports.length - 4; i++) {
        const start = new Date(sortedReports[i].createdAt).getTime();
        const end = new Date(sortedReports[i + 4].createdAt).getTime();
        const diffMinutes = (end - start) / (1000 * 60);

        if (diffMinutes < 30) {
            return {
                type: "rapid_completion",
                severity: "info",
                title: "패턴 정보: 빠른 연속 제출",
                message: `30분 내에 5건 이상의 보고서가 제출되었습니다. 일괄 처리된 서류일 수 있습니다.`,
                inspectorName: "",
                documentCount: 5,
            };
        }
    }

    return null;
}

/**
 * Convert pattern warnings to ValidationIssue format
 */
export function patternWarningsToIssues(warnings: PatternWarning[]): ValidationIssue[] {
    return warnings.map((w) => ({
        severity: w.severity,
        title: w.title,
        message: w.message,
        ruleId: `pattern_${w.type}`,
    }));
}
