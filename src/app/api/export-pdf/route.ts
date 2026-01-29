export const runtime = "nodejs";

import { NextResponse } from "next/server";

// Define types
interface ExportData {
    fileName: string;
    projectName?: string;
    documentType?: string | null;
    createdAt: string; // ISO string from client
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

function getSeverityKorean(severity: string): string {
    const map: Record<string, string> = {
        error: "심각",
        warn: "경고",
        info: "정보",
    };
    return map[severity] || severity;
}

function getSeverityColor(severity: string): string {
    const map: Record<string, string> = {
        error: "#ef4444",
        warn: "#f97316",
        info: "#3b82f6",
    };
    return map[severity] || "#64748b";
}

function getSeverityBgColor(severity: string): string {
    const map: Record<string, string> = {
        error: "#fee2e2",
        warn: "#ffedd5",
        info: "#dbeafe",
    };
    return map[severity] || "#f1f5f9";
}

/**
 * Escapes HTML special characters to prevent injection attacks.
 * Prevents SSRF, XSS, and local file disclosure during PDF generation.
 */
function escapeHtml(unsafe: string | undefined | null): string {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function buildHTMLContent(data: ExportData): string {
    const createdAt = new Date(data.createdAt);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap" rel="stylesheet">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Nanum Myeongjo', serif;
                    line-height: 1.8;
                    color: #1e293b;
                    padding: 40px;
                    background: white;
                    font-size: 14px;
                }

                .header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #22c55e;
                }

                .header h1 {
                    font-size: 32px;
                    font-weight: bold;
                    color: #0f172a;
                    margin-bottom: 10px;
                }

                .header .subtitle {
                    font-size: 14px;
                    color: #64748b;
                    font-weight: 600;
                }

                .info-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 30px;
                }

                .info-row {
                    display: flex;
                    padding: 8px 0;
                    border-bottom: 1px solid #e2e8f0;
                }

                .info-row:last-child {
                    border-bottom: none;
                }

                .info-label {
                    font-weight: bold;
                    color: #475569;
                    width: 120px;
                    flex-shrink: 0;
                }

                .info-value {
                    color: #0f172a;
                    flex: 1;
                }

                .section {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }

                .section-title {
                    font-size: 20px;
                    font-weight: bold;
                    color: white;
                    margin-bottom: 15px;
                    padding: 10px 15px;
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    border-radius: 6px;
                }

                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                }

                .summary-card {
                    background: white;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                }

                .summary-label {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 600;
                    margin-bottom: 8px;
                }

                .summary-value {
                    font-size: 28px;
                    font-weight: bold;
                    color: #0f172a;
                }

                .issues-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }

                .issues-table th {
                    background: #f1f5f9;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                    color: #475569;
                    border-bottom: 2px solid #cbd5e1;
                    font-size: 14px;
                }

                .issues-table td {
                    padding: 12px;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 13px;
                }

                .issues-table tr:last-child td {
                    border-bottom: none;
                }

                .issues-table tr:nth-child(even) {
                    background: #f8fafc;
                }

                .severity-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .issue-number {
                    font-weight: bold;
                    color: #64748b;
                }

                .issue-title {
                    font-weight: 600;
                    color: #0f172a;
                    margin-bottom: 4px;
                }

                .issue-message {
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #e2e8f0;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 11px;
                }

                .no-issues {
                    text-align: center;
                    padding: 40px;
                    color: #22c55e;
                    font-size: 16px;
                    font-weight: 600;
                    background: #f0fdf4;
                    border-radius: 8px;
                    border: 2px solid #bbf7d0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>안전 점검 보고서</h1>
                <div class="subtitle">스마트 안전지킴이 - 경상남도 중소기업 지원 시스템</div>
            </div>

            <div class="info-box">
                <div class="info-row">
                    <div class="info-label">파일명</div>
                    <div class="info-value">${escapeHtml(data.fileName)}</div>
                </div>
                ${data.projectName ? `
                <div class="info-row">
                    <div class="info-label">프로젝트</div>
                    <div class="info-value">${escapeHtml(data.projectName)}</div>
                </div>
                ` : ''}
                ${data.documentType ? `
                <div class="info-row">
                    <div class="info-label">문서 유형</div>
                    <div class="info-value">${escapeHtml(data.documentType)}</div>
                </div>
                ` : ''}
                <div class="info-row">
                    <div class="info-label">생성 날짜</div>
                    <div class="info-value">${createdAt.toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">검증 요약</div>
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="summary-label">총 문제점</div>
                        <div class="summary-value">${data.summary.totalIssues}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">심각한 문제</div>
                        <div class="summary-value" style="color: #ef4444;">${data.summary.criticalCount}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">경고</div>
                        <div class="summary-value" style="color: #f97316;">${data.summary.warningCount}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">정보</div>
                        <div class="summary-value" style="color: #3b82f6;">${data.summary.infoCount}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">발견된 문제점</div>
                ${data.issues.length === 0 ? `
                    <div class="no-issues">
                        ✓ 발견된 문제가 없습니다. 모든 검증을 통과했습니다!
                    </div>
                ` : `
                    <table class="issues-table">
                        <thead>
                            <tr>
                                <th style="width: 50px;">#</th>
                                <th style="width: 100px;">심각도</th>
                                <th>문제 내용</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.issues.map((issue, idx) => `
                                <tr>
                                    <td class="issue-number">${idx + 1}</td>
                                    <td>
                                        <span class="severity-badge" style="background: ${getSeverityBgColor(issue.severity)}; color: ${getSeverityColor(issue.severity)};">
                                            ${getSeverityKorean(issue.severity)}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="issue-title">${escapeHtml(issue.title)}</div>
                                        <div class="issue-message">${escapeHtml(issue.message)}</div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>

            <div class="footer">
                <div>Generated by Smart Safety Guardian (스마트 안전지킴이)</div>
                <div style="margin-top: 5px;">Luna Team - GNU RISE AI+X Competition 2026</div>
            </div>
        </body>
        </html>
    `;
}

export async function POST(req: Request) {
    try {
        const data: ExportData = await req.json();

        console.log('[API Export PDF] Received request:', {
            fileName: data.fileName,
            issuesCount: data.issues?.length,
            projectName: data.projectName
        });

        // Validate required fields
        if (!data.fileName || !data.issues || !data.summary) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Build HTML content
        const htmlContent = buildHTMLContent(data);

        // Dynamic import of html-pdf-node
        const htmlPdf = require('html-pdf-node');

        const options = {
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            },
            preferCSSPageSize: true
        };

        const file = { content: htmlContent };

        console.log('[API Export PDF] Generating PDF...');

        // Generate PDF buffer
        const pdfBuffer = await htmlPdf.generatePdf(file, options);

        console.log('[API Export PDF] PDF generated successfully, size:', pdfBuffer.length);

        // Generate filename
        const datePattern = /^\d{4}-\d{2}-\d{2}_/;
        let finalFilename: string;

        if (datePattern.test(data.fileName)) {
            const cleanFileName = data.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
            finalFilename = `${cleanFileName}_report.pdf`;
        } else {
            const dateStr = new Date(data.createdAt).toISOString().split('T')[0];
            const cleanFileName = data.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
            finalFilename = `${dateStr}_${cleanFileName}_report.pdf`;
        }

        // Return PDF as blob
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(finalFilename)}"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('[API Export PDF] Error:', error);
        return NextResponse.json(
            { error: `PDF generation failed: ${error.message}` },
            { status: 500 }
        );
    }
}
