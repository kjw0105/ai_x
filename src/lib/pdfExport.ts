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

export async function exportReportToPDF(data: ExportData) {
    // DIAGNOSTIC CHECK 1: Log data being passed
    console.log('[PDF Export] Starting PDF generation with data:', {
        fileName: data.fileName,
        projectName: data.projectName,
        issuesCount: data.issues.length,
        totalIssues: data.summary.totalIssues,
        hasIssues: data.issues.length > 0
    });

    // DIAGNOSTIC CHECK 2: Validate data
    if (!data.fileName) {
        throw new Error('PDF Export Error: fileName is required');
    }
    if (!data.issues) {
        throw new Error('PDF Export Error: issues array is required');
    }
    if (!data.summary) {
        throw new Error('PDF Export Error: summary object is required');
    }

    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;

    console.log('[PDF Export] html2pdf library loaded successfully');

    // Create HTML template
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
                    line-height: 1.6;
                    color: #1e293b;
                    padding: 40px;
                    background: white;
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
                }

                .section-title {
                    font-size: 20px;
                    font-weight: bold;
                    color: #0f172a;
                    margin-bottom: 15px;
                    padding: 10px 15px;
                    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                    color: white;
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
                    <div class="info-value">${data.fileName}</div>
                </div>
                ${data.projectName ? `
                <div class="info-row">
                    <div class="info-label">프로젝트</div>
                    <div class="info-value">${data.projectName}</div>
                </div>
                ` : ''}
                ${data.documentType ? `
                <div class="info-row">
                    <div class="info-label">문서 유형</div>
                    <div class="info-value">${data.documentType}</div>
                </div>
                ` : ''}
                <div class="info-row">
                    <div class="info-label">생성 날짜</div>
                    <div class="info-value">${data.createdAt.toLocaleString('ko-KR', {
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
                                        <div class="issue-title">${issue.title}</div>
                                        <div class="issue-message">${issue.message}</div>
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

    // Create a temporary container (MUST be visible for html2canvas to work)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // CRITICAL: Make element visible but off-screen
    // html2canvas CANNOT capture invisible elements (opacity: 0 fails)
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.height = 'auto';
    tempDiv.style.zIndex = '99999'; // Bring to front temporarily for debugging
    tempDiv.style.background = 'white'; // Ensure white background
    tempDiv.style.overflow = 'visible';
    // DO NOT set opacity to 0 - html2canvas needs it visible!

    console.log('[PDF Export] Created temp container, HTML length:', htmlContent.length);
    console.log('[PDF Export] Appending to document body...');
    alert('PDF EXPORT: Starting generation. Check console for details.');

    document.body.appendChild(tempDiv);

    // DIAGNOSTIC CHECK 3: Wait longer for DOM to be ready and fonts to load
    await new Promise(resolve => setTimeout(resolve, 500)); // Increased to 500ms
    console.log('[PDF Export] DOM element rendered and ready');

    // FIX: Check if fileName already contains a date pattern (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}_/;
    let finalFilename: string;

    if (datePattern.test(data.fileName)) {
        // FileName already has date, don't add it again
        const cleanFileName = data.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
        finalFilename = `${cleanFileName}_report.pdf`;
        console.log('[PDF Export] Filename already has date, using:', finalFilename);
    } else {
        // Add date prefix
        const dateStr = data.createdAt.toISOString().split('T')[0];
        const cleanFileName = data.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
        finalFilename = `${dateStr}_${cleanFileName}_report.pdf`;
        console.log('[PDF Export] Adding date prefix:', finalFilename);
    }

    // PDF options
    const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: finalFilename,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: true, // ENABLE logging for debugging
            windowWidth: 800, // Set explicit width
            windowHeight: 1200 // Set explicit height
        },
        jsPDF: {
            unit: 'mm' as const,
            format: 'a4' as const,
            orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as any }
    };

    // Generate PDF
    try {
        console.log('[PDF Export] Starting html2pdf conversion...');
        console.log('[PDF Export] Options:', opt);

        // Use outputPdf to get the blob first for better error tracking
        const pdfBlob = await html2pdf()
            .set(opt)
            .from(tempDiv)
            .outputPdf('blob');

        console.log('[PDF Export] PDF blob generated successfully, size:', pdfBlob.size, 'bytes');

        // DIAGNOSTIC CHECK 4: Verify PDF is not empty
        if (pdfBlob.size === 0 || pdfBlob.size < 1000) {
            throw new Error(`PDF Export Error: Generated PDF is too small (${pdfBlob.size} bytes). This usually means the content failed to render.`);
        }

        // Now trigger the download with the blob
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('[PDF Export] PDF download triggered successfully:', finalFilename);
        alert(`PDF EXPORT: Success! File: ${finalFilename}, Size: ${pdfBlob.size} bytes`);

        // Hide the element immediately (but don't remove yet)
        tempDiv.style.display = 'none';

        // Clean up after ensuring PDF is saved (longer delay for safety)
        setTimeout(() => {
            if (document.body.contains(tempDiv)) {
                document.body.removeChild(tempDiv);
                console.log('[PDF Export] Temp container cleaned up');
            }
        }, 1000); // Increased to 1000ms for safety
    } catch (error: any) {
        // DIAGNOSTIC CHECK 5: Enhanced error logging
        console.error('[PDF Export] CRITICAL ERROR during PDF generation:');
        console.error('[PDF Export] Error type:', error.constructor.name);
        console.error('[PDF Export] Error message:', error.message);
        console.error('[PDF Export] Error stack:', error.stack);
        console.error('[PDF Export] Full error object:', error);

        // Clean up on error
        if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
            console.log('[PDF Export] Temp container cleaned up after error');
        }

        // Re-throw with more context
        throw new Error(`PDF generation failed: ${error.message || 'Unknown error'}`);
    }
}
