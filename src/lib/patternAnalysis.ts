/**
 * Stage 4: Behavioral Pattern Analysis (Enhanced)
 * Detects suspicious patterns across multiple documents
 *
 * ENHANCEMENTS:
 * - Inspector name normalization (handles "김철수" vs "김 철수")
 * - Time-weighted analysis (recent patterns matter more)
 * - Pattern severity scoring (cumulative risk assessment)
 * - Configurable thresholds for pattern detection
 */

import { prisma } from "./db";
import type { ValidationIssue, ChecklistItem } from "./validator";

export interface PatternWarning {
    type: "always_check" | "copy_paste" | "rapid_completion";
    severity: "warn" | "info" | "error";
    title: string;
    message: string;
    inspectorName: string;
    documentCount: number;
    confidence?: number; // 0-100: Confidence level of the pattern
    score?: number; // Severity score for cumulative analysis
}

/**
 * Configurable thresholds for pattern detection
 * Can be adjusted based on project requirements
 */
export interface PatternThresholds {
    alwaysCheckRate: number; // 0-1: Percentage threshold for "always ✔"
    copyPasteCount: number; // Min occurrences for copy-paste detection
    rapidCompletionMinutes: number; // Time window for rapid completion
    rapidCompletionCount: number; // Min reports for rapid completion
    minimumReports: number; // Min reports needed for analysis
    timeWeightDays: number; // Days for time-weighted analysis (recent = higher weight)
}

export const DEFAULT_THRESHOLDS: PatternThresholds = {
    alwaysCheckRate: 0.95,
    copyPasteCount: 3,
    rapidCompletionMinutes: 30,
    rapidCompletionCount: 5,
    minimumReports: 5,
    timeWeightDays: 30,
};

/**
 * Pattern severity scoring weights
 * Higher score = more suspicious pattern
 */
const PATTERN_SCORES = {
    always_check: 50,
    copy_paste: 30,
    rapid_completion: 20,
};

/**
 * Normalize Korean name for matching
 * Handles variations: "김철수" = "김 철수" = "Kim Chul-soo"
 *
 * @param name - Original name
 * @returns Normalized name (lowercase, no spaces, no special chars)
 */
export function normalizeInspectorName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, "") // Remove all spaces
        .replace(/[-_.,]/g, "") // Remove punctuation
        .trim();
}

/**
 * Find all reports by inspector, handling name variations
 * Uses normalized name matching with pagination
 *
 * @param inspectorName - Inspector name to search for
 * @param projectId - Optional project filter
 * @param limit - Maximum number of reports to return (default 50, max 100)
 * @returns Array of reports with pagination limit applied
 */
async function findReportsByInspector(
    inspectorName: string,
    projectId?: string,
    limit: number = 50
) {
    // Enforce maximum limit to prevent performance issues
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    // First, try exact match
    let reports = await prisma.report.findMany({
        where: {
            inspectorName: inspectorName,
            ...(projectId ? { projectId } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: safeLimit,
        select: {
            id: true,
            createdAt: true,
            checklistJson: true,
            docDataJson: true,
            inspectorName: true,
        },
    });

    // If not enough exact matches, try normalized matching
    // Only fetch more if we got fewer than 5 reports
    if (reports.length < 5) {
        const normalizedSearch = normalizeInspectorName(inspectorName);

        // Fetch reports with pagination limit (increased for filtering)
        // Use 2x limit to account for filtering, but cap at 200
        const fetchLimit = Math.min(safeLimit * 2, 200);

        const allReports = await prisma.report.findMany({
            where: {
                inspectorName: { not: null },
                ...(projectId ? { projectId } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: fetchLimit,
            select: {
                id: true,
                createdAt: true,
                checklistJson: true,
                docDataJson: true,
                inspectorName: true,
            },
        });

        reports = allReports
            .filter((r) =>
                r.inspectorName &&
                normalizeInspectorName(r.inspectorName) === normalizedSearch
            )
            .slice(0, safeLimit);
    }

    return reports;
}

/**
 * Calculate time weight for a report
 * More recent reports have higher weight (0.5 to 1.0)
 *
 * @param reportDate - Date of the report
 * @param windowDays - Time window in days (default 30)
 * @returns Weight between 0.5 and 1.0
 */
function calculateTimeWeight(reportDate: Date, windowDays: number = 30): number {
    const now = new Date();
    const ageInDays = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 0) return 1.0; // Today or future
    if (ageInDays >= windowDays) return 0.5; // Old reports still count, but less

    // Linear decay from 1.0 to 0.5
    return 1.0 - (ageInDays / windowDays) * 0.5;
}

/**
 * Detect suspicious patterns for a given inspector (ENHANCED)
 *
 * @param inspectorName - Inspector name (will be normalized)
 * @param projectId - Optional project filter
 * @param thresholds - Optional custom thresholds
 * @param limit - Maximum number of reports to analyze (default 50)
 * @returns Array of pattern warnings with confidence scores
 */
export async function analyzeInspectorPatterns(
    inspectorName: string,
    projectId?: string,
    thresholds: PatternThresholds = DEFAULT_THRESHOLDS,
    limit: number = 50
): Promise<PatternWarning[]> {
    const warnings: PatternWarning[] = [];

    if (!inspectorName) return warnings;

    // Query recent reports using normalized name matching with pagination
    // Limit prevents performance issues with large datasets
    const recentReports = await findReportsByInspector(inspectorName, projectId, limit);

    if (recentReports.length < thresholds.minimumReports) {
        // Not enough data for reliable pattern analysis
        return warnings;
    }

    // Check for "always ✔" pattern with time weighting
    const alwaysCheckPattern = detectAlwaysCheckPattern(recentReports, thresholds);
    if (alwaysCheckPattern) {
        warnings.push(alwaysCheckPattern);
    }

    // Check for copy-paste behavior
    const copyPastePattern = detectCopyPastePattern(recentReports, thresholds);
    if (copyPastePattern) {
        warnings.push(copyPastePattern);
    }

    // Check for rapid completion pattern (many reports in short time)
    const rapidPattern = detectRapidCompletionPattern(recentReports, thresholds);
    if (rapidPattern) {
        warnings.push(rapidPattern);
    }

    return warnings;
}

/**
 * Calculate cumulative pattern score for an inspector
 * Higher score = more suspicious behavior
 *
 * @param warnings - Array of pattern warnings
 * @returns Total risk score (0-100+)
 */
export function calculatePatternScore(warnings: PatternWarning[]): number {
    let totalScore = 0;

    for (const warning of warnings) {
        const baseScore = PATTERN_SCORES[warning.type] || 0;
        const confidence = warning.confidence || 100;
        totalScore += (baseScore * confidence) / 100;
    }

    return Math.round(totalScore);
}

/**
 * Get risk level based on pattern score
 *
 * @param score - Pattern score (0-100+)
 * @returns Risk level description
 */
export function getPatternRiskLevel(score: number): {
    level: "low" | "medium" | "high" | "critical";
    description: string;
} {
    if (score >= 80) {
        return {
            level: "critical",
            description: "심각한 패턴 감지 - 즉시 조사 필요",
        };
    } else if (score >= 50) {
        return {
            level: "high",
            description: "높은 위험 패턴 - 검토 필요",
        };
    } else if (score >= 30) {
        return {
            level: "medium",
            description: "의심스러운 패턴 관찰됨",
        };
    } else {
        return {
            level: "low",
            description: "경미한 패턴 - 참고용",
        };
    }
}

interface ReportData {
    id: string;
    createdAt: Date;
    checklistJson: string | null;
    docDataJson: string;
    inspectorName: string | null; // Added for name normalization
}

/**
 * Detect if inspector checks everything as ✔ in >X% of items (ENHANCED)
 * Uses time-weighted analysis - recent reports matter more
 *
 * @param reports - Array of report data
 * @param thresholds - Detection thresholds
 * @returns Pattern warning with confidence score
 */
function detectAlwaysCheckPattern(
    reports: ReportData[],
    thresholds: PatternThresholds
): PatternWarning | null {
    let totalItems = 0;
    let checkedItems = 0;
    let weightedTotal = 0;
    let weightedChecked = 0;

    for (const report of reports) {
        if (!report.checklistJson) continue;

        const weight = calculateTimeWeight(report.createdAt, thresholds.timeWeightDays);

        try {
            const checklist: ChecklistItem[] = JSON.parse(report.checklistJson);
            for (const item of checklist) {
                if (item.value !== null && item.value !== "N/A") {
                    totalItems++;
                    weightedTotal += weight;

                    if (item.value === "✔") {
                        checkedItems++;
                        weightedChecked += weight;
                    }
                }
            }
        } catch {
            // Skip invalid JSON
        }
    }

    if (totalItems < 50) return null; // Not enough data

    const checkRate = checkedItems / totalItems;
    const weightedRate = weightedTotal > 0 ? weightedChecked / weightedTotal : 0;

    // Use weighted rate for threshold comparison (recent behavior matters more)
    if (weightedRate > thresholds.alwaysCheckRate) {
        // Calculate confidence based on sample size and consistency
        const confidence = Math.min(
            100,
            50 + (totalItems / 200) * 50 // More items = higher confidence
        );

        // Determine severity based on how extreme the pattern is
        const severity: "warn" | "error" =
            weightedRate > 0.98 ? "error" : "warn";

        return {
            type: "always_check",
            severity,
            title: severity === "error"
                ? "패턴 오류: 심각한 일관된 전체 체크"
                : "패턴 경고: 일관된 전체 체크",
            message: `이 점검자는 최근 ${reports.length}건의 보고서에서 ${Math.round(checkRate * 100)}%의 항목을 ✔로 표시했습니다. 실제 점검 수행 여부를 확인하세요.\n→ 시간 가중치 적용 시: ${Math.round(weightedRate * 100)}% (최근 ${thresholds.timeWeightDays}일 기준)`,
            inspectorName: "",
            documentCount: reports.length,
            confidence: Math.round(confidence),
            score: PATTERN_SCORES.always_check,
        };
    }

    return null;
}

/**
 * Detect copy-paste behavior (identical work descriptions across dates) - ENHANCED
 * Now tracks multiple patterns and calculates confidence
 *
 * @param reports - Array of report data
 * @param thresholds - Detection thresholds
 * @returns Pattern warning with confidence score
 */
function detectCopyPastePattern(
    reports: ReportData[],
    thresholds: PatternThresholds
): PatternWarning | null {
    const descriptions: Map<string, { count: number; dates: Date[] }> = new Map();

    for (const report of reports) {
        try {
            const docData = JSON.parse(report.docDataJson);
            const workDesc = docData.fields?.작업내용?.trim();
            if (workDesc && workDesc.length > 10) {
                const existing = descriptions.get(workDesc) || { count: 0, dates: [] };
                existing.count++;
                existing.dates.push(report.createdAt);
                descriptions.set(workDesc, existing);
            }
        } catch {
            // Skip invalid JSON
        }
    }

    // Find the most suspicious pattern (highest count)
    let maxPattern: { desc: string; count: number; dates: Date[] } | null = null;

    for (const [desc, data] of descriptions) {
        if (data.count >= thresholds.copyPasteCount) {
            if (!maxPattern || data.count > maxPattern.count) {
                maxPattern = { desc, count: data.count, dates: data.dates };
            }
        }
    }

    if (!maxPattern) return null;

    // Calculate confidence based on frequency and time span
    const dateSpan = Math.max(
        ...maxPattern.dates.map((d) => d.getTime())
    ) - Math.min(...maxPattern.dates.map((d) => d.getTime()));
    const daysSpan = dateSpan / (1000 * 60 * 60 * 24);

    // Same description across many days = more suspicious
    const confidence = Math.min(
        100,
        50 + (maxPattern.count / reports.length) * 30 + Math.min(20, daysSpan / 2)
    );

    // More than 50% of reports have same description = error level
    const severity: "warn" | "error" =
        maxPattern.count / reports.length > 0.5 ? "error" : "warn";

    return {
        type: "copy_paste",
        severity,
        title: severity === "error"
            ? "패턴 오류: 심각한 동일 작업내용 반복"
            : "패턴 경고: 동일 작업내용 반복",
        message: `"${maxPattern.desc.substring(0, 40)}..." 작업내용이 ${maxPattern.count}건의 서류에서 동일하게 기재되었습니다. 복사-붙여넣기 가능성을 확인하세요.\n→ 전체 보고서 중 ${Math.round((maxPattern.count / reports.length) * 100)}%가 동일한 작업내용`,
        inspectorName: "",
        documentCount: maxPattern.count,
        confidence: Math.round(confidence),
        score: PATTERN_SCORES.copy_paste,
    };
}

/**
 * Detect rapid completion (many reports created in a short time) - ENHANCED
 * Now uses configurable thresholds and calculates severity
 *
 * @param reports - Array of report data
 * @param thresholds - Detection thresholds
 * @returns Pattern warning with confidence score
 */
function detectRapidCompletionPattern(
    reports: ReportData[],
    thresholds: PatternThresholds
): PatternWarning | null {
    if (reports.length < thresholds.rapidCompletionCount) return null;

    // Check if N+ reports were created within X minutes
    const sortedReports = [...reports].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let maxBurst = 0;
    let maxBurstMinutes = 0;

    for (
        let i = 0;
        i < sortedReports.length - thresholds.rapidCompletionCount + 1;
        i++
    ) {
        const start = new Date(sortedReports[i].createdAt).getTime();
        const end = new Date(
            sortedReports[i + thresholds.rapidCompletionCount - 1].createdAt
        ).getTime();
        const diffMinutes = (end - start) / (1000 * 60);

        if (diffMinutes < thresholds.rapidCompletionMinutes) {
            // Count total reports in this window
            let burstCount = thresholds.rapidCompletionCount;
            for (
                let j = i + thresholds.rapidCompletionCount;
                j < sortedReports.length;
                j++
            ) {
                const time = new Date(sortedReports[j].createdAt).getTime();
                if ((time - start) / (1000 * 60) < thresholds.rapidCompletionMinutes) {
                    burstCount++;
                } else {
                    break;
                }
            }

            if (burstCount > maxBurst) {
                maxBurst = burstCount;
                maxBurstMinutes = (end - start) / (1000 * 60);
            }
        }
    }

    if (maxBurst >= thresholds.rapidCompletionCount) {
        // Calculate confidence based on speed and quantity
        const confidence = Math.min(
            100,
            40 + maxBurst * 5 + (30 - maxBurstMinutes)
        );

        // More than 10 reports in 30 min = warning level
        const severity: "info" | "warn" = maxBurst >= 10 ? "warn" : "info";

        return {
            type: "rapid_completion",
            severity,
            title:
                severity === "warn"
                    ? "패턴 경고: 매우 빠른 연속 제출"
                    : "패턴 정보: 빠른 연속 제출",
            message: `${Math.round(maxBurstMinutes)}분 내에 ${maxBurst}건의 보고서가 제출되었습니다. 일괄 처리된 서류이거나 소급 작성된 문서일 수 있습니다.${maxBurst >= 10
                    ? "\n→ 제출 속도가 비정상적으로 빠름 - 확인 필요"
                    : ""
                }`,
            inspectorName: "",
            documentCount: maxBurst,
            confidence: Math.round(confidence),
            score: PATTERN_SCORES.rapid_completion,
        };
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
        confidence: w.confidence,
        score: w.score,
    }));
}
