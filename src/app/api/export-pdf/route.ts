export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createRequire } from "module";

interface ExportData {
  fileName: string;
  projectName?: string;
  documentType?: string | null;

  // ✅ TBM
  tbmSummary?: string;
  tbmTranscript?: string;

  createdAt: string; // ISO string
  issues?: Array<{
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
  const map: Record<string, string> = { error: "심각", warn: "경고", info: "정보" };
  return map[severity] || severity;
}

function getSeverityColor(severity: string): string {
  const map: Record<string, string> = { error: "#ef4444", warn: "#f97316", info: "#3b82f6" };
  return map[severity] || "#64748b";
}

function getSeverityBgColor(severity: string): string {
  const map: Record<string, string> = { error: "#fee2e2", warn: "#ffedd5", info: "#dbeafe" };
  return map[severity] || "#f1f5f9";
}

function escapeHtml(unsafe: string | undefined | null): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseTBMSummary(summary: string): { title: string; content: string }[] {
  if (!summary || summary.trim().length === 0) return [];

  const sections: { title: string; content: string }[] = [];
  const lines = summary.split("\n");

  let currentSection: { title: string; content: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match section headers like "1) 오늘 작업 개요" or "1. 오늘 작업 개요" or "**1) 오늘 작업 개요**"
    const sectionMatch = trimmed.match(/^[*]*\d+[).]\s*(.+?)([*]*)$/);

    if (sectionMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        title: sectionMatch[1].replace(/\*\*/g, "").trim(),
        content: "",
      };
    } else if (currentSection && trimmed.length > 0) {
      // Add content to current section
      currentSection.content += (currentSection.content ? "\n" : "") + trimmed;
    }
  }

  // Save last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function buildHTMLContent(data: ExportData): string {
  const createdAt = new Date(data.createdAt);
  const issues = Array.isArray(data.issues) ? data.issues : [];

  const tbmSummary = (data.tbmSummary || "").trim();
  const tbmTranscript = (data.tbmTranscript || "").trim();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{
      font-family:'Nanum Myeongjo', serif;
      line-height:1.8;color:#1e293b;padding:40px;background:white;font-size:14px;
    }
    .header{text-align:center;margin-bottom:40px;padding-bottom:20px;border-bottom:3px solid #22c55e;}
    .header h1{font-size:32px;font-weight:bold;color:#0f172a;margin-bottom:10px;}
    .header .subtitle{font-size:14px;color:#64748b;font-weight:600;}
    .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:30px;}
    .info-row{display:flex;padding:8px 0;border-bottom:1px solid #e2e8f0;}
    .info-row:last-child{border-bottom:none;}
    .info-label{font-weight:bold;color:#475569;width:120px;flex-shrink:0;}
    .info-value{color:#0f172a;flex:1;}
    .section{margin-bottom:30px;page-break-inside:avoid;}
    .section-title{
      font-size:20px;font-weight:bold;color:white;margin-bottom:15px;padding:10px 15px;
      background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);border-radius:6px;
    }
    .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:30px;}
    .summary-card{background:white;border:2px solid #e2e8f0;border-radius:8px;padding:15px;text-align:center;}
    .summary-label{font-size:12px;color:#64748b;font-weight:600;margin-bottom:8px;}
    .summary-value{font-size:28px;font-weight:bold;color:#0f172a;}

    .tbm-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;}
    .tbm-text{white-space:pre-wrap;color:#0f172a;font-size:13px;line-height:1.7;}
    .muted{color:#94a3b8;font-size:13px;}

    .issues-table{width:100%;border-collapse:collapse;margin-top:15px;}
    .issues-table th{
      background:#f1f5f9;padding:12px;text-align:left;font-weight:bold;color:#475569;
      border-bottom:2px solid #cbd5e1;font-size:14px;
    }
    .issues-table td{padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px;}
    .issues-table tr:last-child td{border-bottom:none;}
    .issues-table tr:nth-child(even){background:#f8fafc;}
    .severity-badge{display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:bold;}
    .issue-number{font-weight:bold;color:#64748b;}
    .issue-title{font-weight:600;color:#0f172a;margin-bottom:4px;}
    .issue-message{color:#64748b;font-size:12px;line-height:1.5;}
    .footer{margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:11px;}
    .no-issues{
      text-align:center;padding:40px;color:#22c55e;font-size:16px;font-weight:600;
      background:#f0fdf4;border-radius:8px;border:2px solid #bbf7d0;
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
    </div>` : ""}
    ${data.documentType ? `
    <div class="info-row">
      <div class="info-label">문서 유형</div>
      <div class="info-value">${escapeHtml(data.documentType)}</div>
    </div>` : ""}
    <div class="info-row">
      <div class="info-label">생성 날짜</div>
      <div class="info-value">${createdAt.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}</div>
    </div>
  </div>

  ${data.documentType === "TBM" || tbmSummary.length > 0 || tbmTranscript.length > 0 ? `
  <div class="section">
    <div class="section-title">TBM (작업 전 대화) 요약</div>
    ${
      tbmSummary.length > 0
        ? (() => {
            const parsedSections = parseTBMSummary(tbmSummary);
            if (parsedSections.length > 0) {
              // Structured format
              return parsedSections.map((section, idx) => `
                <div class="tbm-subsection" style="margin-bottom:20px;">
                  <div style="font-weight:bold;color:#0f172a;margin-bottom:8px;font-size:15px;display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#22c55e;color:white;font-size:13px;font-weight:bold;">${idx + 1}</span>
                    ${escapeHtml(section.title)}
                  </div>
                  <div class="tbm-box" style="background:#f8fafc;padding:15px;">
                    <div class="tbm-text" style="white-space:pre-wrap;">${escapeHtml(section.content)}</div>
                  </div>
                </div>
              `).join("");
            } else {
              // Fallback: no structured sections found
              return `
                <div class="tbm-box">
                  <div class="tbm-text">${escapeHtml(tbmSummary)}</div>
                </div>
              `;
            }
          })()
        : `<div class="muted">TBM 요약이 없습니다.</div>`
    }
    ${tbmTranscript.length > 0 ? `
    <div style="margin-top:25px;page-break-before:avoid;">
      <div style="font-weight:bold;color:#475569;margin-bottom:10px;font-size:15px;display:flex;align-items:center;gap:8px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#3b82f6;color:white;font-size:18px;">📝</span>
        전사 내용 (Transcript)
      </div>
      <div class="tbm-box" style="background:#f8fafc;max-height:300px;overflow-y:auto;">
        <div class="tbm-text" style="font-size:12px;color:#64748b;white-space:pre-wrap;">${escapeHtml(tbmTranscript)}</div>
      </div>
    </div>
    ` : ""}
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">검증 요약</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">총 문제점</div>
        <div class="summary-value">${data.summary.totalIssues}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">심각한 문제</div>
        <div class="summary-value" style="color:#ef4444;">${data.summary.criticalCount}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">경고</div>
        <div class="summary-value" style="color:#f97316;">${data.summary.warningCount}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">정보</div>
        <div class="summary-value" style="color:#3b82f6;">${data.summary.infoCount}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">발견된 문제점</div>
    ${issues.length === 0 ? `
      <div class="no-issues">✓ 발견된 문제가 없습니다. 모든 검증을 통과했습니다!</div>
    ` : `
      <table class="issues-table">
        <thead>
          <tr>
            <th style="width:50px;">#</th>
            <th style="width:100px;">심각도</th>
            <th>문제 내용</th>
          </tr>
        </thead>
        <tbody>
          ${issues
            .map(
              (issue, idx) => `
            <tr>
              <td class="issue-number">${idx + 1}</td>
              <td>
                <span class="severity-badge" style="background:${getSeverityBgColor(
                  issue.severity
                )}; color:${getSeverityColor(issue.severity)};">
                  ${getSeverityKorean(issue.severity)}
                </span>
              </td>
              <td>
                <div class="issue-title">${escapeHtml(issue.title)}</div>
                <div class="issue-message">${escapeHtml(issue.message)}</div>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `}
  </div>

  <div class="footer">
    <div>Generated by Smart Safety Guardian (스마트 안전지킴이)</div>
    <div style="margin-top:5px;">Luna Team - GNU RISE AI+X Competition 2026</div>
  </div>
</body>
</html>
`;
}

export async function POST(req: Request) {
  try {
    const data: ExportData = await req.json();

    console.log("[API Export PDF] Received request:", {
      fileName: data.fileName,
      documentType: data.documentType,
      tbmSummaryLen: (data.tbmSummary || "").length,
      tbmTranscriptLen: (data.tbmTranscript || "").length,
      issuesCount: Array.isArray(data.issues) ? data.issues.length : 0,
    });

    // ✅ Detailed TBM logging
    if (data.tbmSummary && data.tbmSummary.length > 0) {
      console.log("[API Export PDF] TBM Summary present:", data.tbmSummary.substring(0, 200) + "...");
    } else {
      console.log("[API Export PDF] ⚠️ TBM Summary is EMPTY or missing");
    }

    if (!data.fileName || !data.summary || !data.createdAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const htmlContent = buildHTMLContent(data);

    // Load html-pdf-node safely
    let generatePdf: ((file: { content: string }, options: Record<string, unknown>) => Promise<Buffer>) | null =
      null;

    try {
      const require = createRequire(import.meta.url);
      const runtimeRequire = eval("require") as NodeRequire;

      const htmlPdfModule = (runtimeRequire?.("html-pdf-node") ?? require("html-pdf-node")) as any;
      const htmlPdf = htmlPdfModule?.default ?? htmlPdfModule;

      generatePdf = htmlPdf?.generatePdf ?? htmlPdf?.default?.generatePdf ?? htmlPdf?.default ?? null;
    } catch (importError: any) {
      console.error("[API Export PDF] Failed to load html-pdf-node:", importError);
      return NextResponse.json(
        { error: "PDF generation dependency is missing. Please install html-pdf-node." },
        { status: 500 }
      );
    }

    if (!generatePdf) {
      console.error("[API Export PDF] html-pdf-node did not expose generatePdf.");
      return NextResponse.json(
        { error: "PDF generation module is unavailable. Please verify html-pdf-node installation." },
        { status: 500 }
      );
    }

    const options = {
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      preferCSSPageSize: true,
    };

    console.log("[API Export PDF] Generating PDF...");
    const pdfBuffer = await generatePdf({ content: htmlContent }, options);
    console.log("[API Export PDF] PDF generated successfully, size:", pdfBuffer.length);

    const datePattern = /^\d{4}-\d{2}-\d{2}_/;
    let finalFilename: string;

    if (datePattern.test(data.fileName)) {
      const cleanFileName = data.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
      finalFilename = `${cleanFileName}_report.pdf`;
    } else {
      const dateStr = new Date(data.createdAt).toISOString().split("T")[0];
      const cleanFileName = data.fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9가-힣_-]/g, "_");
      finalFilename = `${dateStr}_${cleanFileName}_report.pdf`;
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(finalFilename)}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("[API Export PDF] Error:", error);
    return NextResponse.json({ error: `PDF generation failed: ${error.message}` }, { status: 500 });
  }
}
