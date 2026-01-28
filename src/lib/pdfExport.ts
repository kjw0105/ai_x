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

    // Create overlay container for better UX
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '999999';
    overlay.style.background = 'rgba(0, 0, 0, 0.8)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.flexDirection = 'column';
    overlay.style.gap = '20px';

    // Loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.style.color = 'white';
    loadingMsg.style.fontSize = '20px';
    loadingMsg.style.fontWeight = 'bold';
    loadingMsg.textContent = 'PDF 생성 중... 잠시만 기다려주세요';
    overlay.appendChild(loadingMsg);

    // Create the actual PDF content container
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // CRITICAL: Element must be visible and properly rendered for html2canvas
    tempDiv.style.position = 'relative'; // Normal flow
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.maxWidth = '800px'; // Reasonable screen width
    tempDiv.style.height = 'auto';
    tempDiv.style.background = 'white'; // Ensure white background
    tempDiv.style.padding = '40px'; // Match body padding from HTML
    tempDiv.style.overflow = 'visible';
    tempDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    tempDiv.style.maxHeight = '80vh'; // Don't overflow screen
    tempDiv.style.overflowY = 'auto'; // Scrollable if needed

    overlay.appendChild(tempDiv);

    console.log('[PDF Export] Created temp container, HTML length:', htmlContent.length);
    console.log('[PDF Export] Appending overlay to document body...');

    document.body.appendChild(overlay);

    // DIAGNOSTIC CHECK 3: Wait for DOM, fonts, and rendering
    console.log('[PDF Export] Waiting for fonts and rendering...');

    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
        console.log('[PDF Export] Fonts loaded');
    }

    // Additional wait for layout and painting
    await new Promise(resolve => setTimeout(resolve, 1500)); // Increased to 1.5 seconds
    console.log('[PDF Export] DOM element fully rendered and ready');

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

    // PDF options - optimized for content capture
    const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: finalFilename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
            scale: 2, // High quality
            useCORS: true,
            letterRendering: true,
            logging: true, // ENABLE logging for debugging
            allowTaint: false,
            backgroundColor: '#ffffff',
            scrollY: 0,
            scrollX: 0,
            width: tempDiv.scrollWidth,
            height: tempDiv.scrollHeight,
            onclone: (clonedDoc: Document) => {
                // Ensure cloned document has same styles
                console.log('[PDF Export] Document cloned for rendering');
                const clonedElement = clonedDoc.querySelector('div');
                if (clonedElement) {
                    (clonedElement as HTMLElement).style.maxHeight = 'none';
                    (clonedElement as HTMLElement).style.overflow = 'visible';
                }
            }
        },
        jsPDF: {
            unit: 'mm' as const,
            format: 'a4' as const,
            orientation: 'portrait' as const,
            compress: true
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

        // Update loading message to show success
        loadingMsg.textContent = `✓ PDF 생성 완료! (${Math.round(pdfBlob.size / 1024)}KB)`;
        loadingMsg.style.color = '#22c55e';

        // Show success alert with details
        alert(`PDF EXPORT SUCCESS!\nFile: ${finalFilename}\nSize: ${pdfBlob.size} bytes (${Math.round(pdfBlob.size / 1024)}KB)`);

        // Remove overlay after short delay
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                console.log('[PDF Export] Overlay cleaned up');
            }
        }, 1000);
    } catch (error: any) {
        // DIAGNOSTIC CHECK 5: Enhanced error logging
        console.error('[PDF Export] CRITICAL ERROR during PDF generation:');
        console.error('[PDF Export] Error type:', error.constructor.name);
        console.error('[PDF Export] Error message:', error.message);
        console.error('[PDF Export] Error stack:', error.stack);
        console.error('[PDF Export] Full error object:', error);

        // Update loading message to show error
        loadingMsg.textContent = '❌ PDF 생성 실패';
        loadingMsg.style.color = '#ef4444';

        // Clean up on error
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                console.log('[PDF Export] Overlay cleaned up after error');
            }
        }, 2000);

        // Re-throw with more context
        throw new Error(`PDF generation failed: ${error.message || 'Unknown error'}`);
    }
}
