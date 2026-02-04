
import htmlPdf from 'html-pdf-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'test-documents');

// Ensure output directories exist
const REQUIRED_DIRS = [
  '1-valid',
  '2-stage1-format',
  '3-stage2-logic',
  '5-stage4-patterns',
  '7-edge-cases'
];

REQUIRED_DIRS.forEach(dir => {
  const fullPath = path.join(OUTPUT_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${fullPath}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

/**
 * Generate HTML content for the PDF
 */
function generateHtml(options) {
  const {
    date = '2026-02-04',
    siteName = '테스트 건설현장',
    workContent = '철골 구조물 설치 작업',
    workers = '5명',
    inspector = '김철수',
    sig1 = 'present',
    sig2 = 'present',
    checklist = {},
    omitItems = [] // New option
  } = options;

  // Defaults for checklist items
  const items = [
    { id: "ppe_01", text: "안전모 착용", value: checklist.ppe_01 || "checked" },
    { id: "fall_01", text: "고소작업 실시 (2m 이상)", value: checklist.fall_01 || "checked" },
    { id: "ppe_03", text: "안전대 착용", value: checklist.ppe_03 || "checked" },
    { id: "fall_02", text: "추락방호장치 설치", value: checklist.fall_02 || "checked" },
    { id: "fire_01", text: "화기작업 실시", value: checklist.fire_01 || "checked" },
    { id: "fire_02", text: "소화기 비치", value: checklist.fire_02 || "checked" },
    { id: "fire_03", text: "불티비산 방지조치", value: checklist.fire_03 || "checked" },
    { id: "conf_01", text: "밀폐공간 작업", value: checklist.conf_01 || "na" },
    { id: "conf_02", text: "산소농도 측정", value: checklist.conf_02 || "na" },
    { id: "conf_03", text: "환기조치", value: checklist.conf_03 || "na" },
    { id: "exc_01", text: "굴착작업 실시", value: checklist.exc_01 || "na" },
    { id: "exc_02", text: "흙막이 지보공 설치", value: checklist.exc_02 || "na" },
    { id: "elec_02", text: "전기작업 실시", value: checklist.elec_02 || "checked" },
    { id: "ppe_04", text: "안전화 착용", value: checklist.ppe_04 || "checked" },
    { id: "lock_01", text: "잠금장치(LOTO)", value: checklist.lock_01 || "checked" },
  ].filter(item => !omitItems.includes(item.id));

  const rows = items.map((item, idx) => {
    const checked = item.value === 'checked' ? '✔' : '';
    const unchecked = item.value === 'unchecked' ? '✖' : '';
    const na = item.value === 'na' ? 'N/A' : '';

    return `
      <tr>
        <td>${idx + 1}. ${item.text}</td>
        <td style="font-size: 20px;">${checked}</td>
        <td style="font-size: 20px;">${unchecked}</td>
        <td>${na}</td>
      </tr>
    `;
  }).join('');

  const sig1Display = sig1 === 'present' ? `[서명] ${inspector}` : '[ 미서명 ]';
  const sig2Display = sig2 === 'present' ? '[서명] 박현장' : '[ 미서명 ]';

  const dateDisplay = date === '' ? '' : date;

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
      margin: 0;
      padding: 40px;
      background: white;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .info-table th, .info-table td {
      border: 1px solid #333;
      padding: 10px;
      text-align: left;
    }
    .info-table th {
      background: #f0f0f0;
      font-weight: bold;
      width: 20%;
    }
    .checklist-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .checklist-table th, .checklist-table td {
      border: 1px solid #333;
      padding: 12px 8px;
      text-align: center;
    }
    .checklist-table th {
      background: #f0f0f0;
      font-weight: bold;
    }
    .checklist-table td:first-child {
      text-align: left;
      padding-left: 12px;
    }
    .checklist-table .check-col {
      width: 80px;
    }
    .signature-section {
      margin-top: 50px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .signature-box {
      border: 1px solid #ddd;
      padding: 20px;
      border-radius: 4px;
    }
    .signature-box h3 {
      margin-top: 0;
      color: #1f2937;
      font-size: 16px;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 40px;
      padding-top: 10px;
      text-align: center;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>산업안전 점검표</h1>
  <p style="text-align: right; color: #666;">문서번호: DOC-2026-001</p>

  <table class="info-table">
    <tr>
      <th>점검일자</th>
      <td>${dateDisplay}</td>
      <th>현장명</th>
      <td>${siteName}</td>
    </tr>
    <tr>
      <th>작업내용</th>
      <td colspan="3">${workContent}</td>
    </tr>
    <tr>
      <th>작업인원</th>
      <td>${workers}</td>
      <th>점검자</th>
      <td>${inspector}</td>
    </tr>
  </table>

  <h2 style="margin-top: 40px; color: #1f2937;">안전 점검 항목</h2>
  <table class="checklist-table">
    <tr>
      <th style="width: 50%">점검 항목</th>
      <th class="check-col">적합<br>(✔)</th>
      <th class="check-col">부적합<br>(✖)</th>
      <th class="check-col">해당없음<br>(N/A)</th>
    </tr>
    ${rows}
  </table>

  <div class="signature-section">
    <div class="signature-box">
      <h3>담당자 (Inspector)</h3>
      <div class="signature-line">${sig1Display}</div>
    </div>
    <div class="signature-box">
      <h3>현장소장 (Site Manager)</h3>
      <div class="signature-line">${sig2Display}</div>
    </div>
  </div>

  <p style="margin-top: 50px; font-size: 12px; color: #999; text-align: center;">
    본 문서는 산업안전보건법 제36조에 따른 안전점검 기록표입니다.
  </p>
</body>
</html>
  `;
}

const testCases = [
  // 1. Valid Document
  {
    filename: '1-valid/valid-safety-checklist.pdf',
    options: {
      checklist: { // All checked or valid
        ppe_01: 'checked', fall_01: 'checked', ppe_03: 'checked', fall_02: 'checked',
        fire_01: 'checked', fire_02: 'checked', fire_03: 'checked',
        lock_01: 'checked'
      }
    }
  },

  // 2. Format Errors
  {
    filename: '2-stage1-format/missing-date.pdf',
    options: { date: '', workContent: '일상 점검', workers: '3명', inspector: '이영희' }
  },
  {
    filename: '2-stage1-format/missing-both-signatures.pdf',
    options: {
      inspector: '박안전', sig1: 'missing', sig2: 'missing',
      checklist: { exc_01: 'checked' }
    }
  },

  // 3. Logic Errors
  {
    filename: '3-stage2-logic/contradiction-fall-protection.pdf',
    options: {
      siteName: '모순 테스트 현장',
      workContent: '지상 작업 (고소작업 없음)',
      inspector: '최점검',
      checklist: {
        fall_01: 'na', // No height work
        fall_02: 'checked', // But protection installed (Contradiction)
        ppe_03: 'checked'
      }
    }
  },
  {
    filename: '3-stage2-logic/missing-ppe-for-height-work.pdf',
    options: {
      siteName: '고소작업 현장',
      workContent: '3층 외벽 작업 (고소작업)',
      inspector: '정안전',
      checklist: {
        fall_01: 'checked', // Height work YES
        ppe_03: 'unchecked' // Harness NO (Violation)
      }
    }
  },
  {
    filename: '3-stage2-logic/fire-work-no-extinguisher.pdf',
    options: {
      siteName: '용접 작업 현장',
      workContent: '철골 용접 작업',
      inspector: '한용접',
      checklist: {
        fire_01: 'checked', // Fire work YES
        fire_02: 'unchecked' // Extinguisher NO (Violation)
      }
    }
  },
  {
    filename: '3-stage2-logic/confined-space-violations.pdf',
    options: {
      siteName: '지하 작업 현장',
      workContent: '맨홀 내부 점검',
      inspector: '지밀폐',
      checklist: {
        conf_01: 'checked', // Confined space YES
        conf_02: 'unchecked' // Oxygen NO (Violation)
      }
    }
  },
  {
    filename: '3-stage2-logic/electrical-no-lockout.pdf',
    options: {
      siteName: '전기 설비 현장',
      workContent: '배전반 수리',
      inspector: '전기수',
      checklist: {
        elec_02: 'checked', // Electrical work YES
        lock_01: 'unchecked' // LOTO NO (Violation)
      }
    }
  },

  // 4. Pattern Detection (Inspector Kim - Always Check)
  ...[1, 2, 3, 4, 5].map(day => ({
    filename: `5-stage4-patterns/inspector-kim-day${day}.pdf`,
    options: {
      date: `2026-02-0${day}`,
      siteName: '동일 현장',
      workContent: '일상 점검',
      inspector: '김철수',
      checklist: {
        // All checked
        ppe_01: 'checked', fall_01: 'checked', ppe_03: 'checked', fall_02: 'checked',
        fire_01: 'checked', fire_02: 'checked', fire_03: 'checked',
        conf_01: 'checked', conf_02: 'checked', exc_01: 'checked',
        elec_02: 'checked', ppe_04: 'checked', lock_01: 'checked'
      }
    }
  })),

  // 4. Pattern Detection (Inspector Lee - Copy Paste)
  ...[1, 2, 3].map(day => ({
    filename: `5-stage4-patterns/inspector-lee-copypaste${day}.pdf`,
    options: {
      date: `2026-02-0${day}`,
      siteName: '테스트 현장',
      workContent: '일상 점검',
      inspector: '이영희',
      // Exact same checklist for all 3
      checklist: {
        ppe_01: 'checked', fall_01: 'na', ppe_03: 'na', fall_02: 'na',
        fire_01: 'na', fire_02: 'na', fire_03: 'na',
        conf_01: 'na', conf_02: 'na', exc_01: 'na',
        elec_02: 'checked', ppe_04: 'checked', lock_01: 'checked'
      }
    }
  })),

  // 5. Edge Cases
  {
    // 1. Missing Helmet Item (Completeness)
    filename: '7-edge-cases/completeness-missing-helmet.pdf',
    options: {
      omitItems: ['ppe_01'], // Special option to remove item
      checklist: { fall_01: 'checked' }
    }
  },
  {
    // 2. Excavation Hazard (Specific Safety Rule)
    filename: '7-edge-cases/safety-excavation-no-shoring.pdf',
    options: {
      workContent: '지하 배관 교체 (깊이 2m)',
      checklist: {
        exc_01: 'checked', // Excavation YES
        exc_02: 'unchecked' // Shoring NO (Violation)
      }
    }
  },
  {
    // 3. Lazy Pattern (100% N/A)
    filename: '7-edge-cases/pattern-all-na.pdf',
    options: {
      inspector: '김귀찮',
      checklist: {
        ppe_01: 'na', fall_01: 'na', ppe_03: 'na', fall_02: 'na',
        fire_01: 'na', fire_02: 'na', fire_03: 'na',
        conf_01: 'na', conf_02: 'na', exc_01: 'na',
        elec_02: 'na', ppe_04: 'na', lock_01: 'na'
      }
    }
  },
  {
    // 4. Future Date (Format)
    filename: '7-edge-cases/format-future-date.pdf',
    options: { date: '2030-01-01' }
  },
  {
    // 5. Self-Approval (Conflict of Interest)
    filename: '7-edge-cases/pattern-self-approval.pdf',
    options: {
      inspector: '박현장', // Same as site manager
      sig1: 'present',
      sig2: 'present' // '박현장' signs both
    }
  },
  {
    // 6. Weather Conflict (Context)
    filename: '7-edge-cases/context-weather-electrical.pdf',
    options: {
      workContent: '야외 전기 배선 작업',
      checklist: { elec_02: 'checked' }
      // Note: HTML template doesn't explicitly show weather, 
      // but if we updated the template to show it, this would be valuable.
      // For now, it tests if we can generate it.
    }
  }
];

async function generateAll() {
  console.log('Starting PDF generation...');

  for (const testCase of testCases) {
    const outputPath = path.join(OUTPUT_DIR, testCase.filename);
    const htmlContent = generateHtml(testCase.options);

    // Ensure parent dir exists (redundant but safe)
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = { content: htmlContent };
    const options = { format: 'A4', printBackground: true };

    try {
      console.log(`Generating: ${testCase.filename}`);
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      fs.writeFileSync(outputPath, pdfBuffer);
    } catch (err) {
      console.error(`Error generating ${testCase.filename}:`, err);
    }
  }

  console.log('✓ All documents generated successfully!');
}

generateAll().catch(console.error);
