
import puppeteer from 'puppeteer';
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
    '7-edge-cases',
    '8-quality-tests'
];

REQUIRED_DIRS.forEach(dir => {
    const fullPath = path.join(OUTPUT_DIR, dir);
    if (!fs.existsSync(fullPath)) {
        console.log(`Creating directory: ${fullPath}`);
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

/**
 * TEMPLATE 1: CLASSIC (Standard Table)
 */
function renderClassic(data) {
    const { date, siteName, workContent, workers, inspector, sig1, sig2, checklist, omitItems = [], ambiguousItems = [], cssOverride = '' } = data;

    // Default items
    const allItems = [
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

    const rows = allItems.map((item, idx) => {
        let checked = item.value === 'checked' ? '✔' : '';
        let unchecked = item.value === 'unchecked' ? '✖' : '';
        const na = item.value === 'na' ? 'N/A' : '';

        // Handle ambiguous (double check) visual error
        if (ambiguousItems.includes(item.id)) {
            checked = '✔';
            unchecked = '✔'; // Both marked!
        }

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

    return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; }
        body { font-family: "Malgun Gothic", sans-serif; padding: 40px; background: white; }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 30px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .info-table th, .info-table td { border: 1px solid #333; padding: 10px; text-align: left; }
        .info-table th { background: #f0f0f0; font-weight: bold; width: 20%; }
        .checklist-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .checklist-table th, .checklist-table td { border: 1px solid #333; padding: 12px 8px; text-align: center; }
        .checklist-table th { background: #f0f0f0; font-weight: bold; }
        .checklist-table td:first-child { text-align: left; padding-left: 12px; }
        .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        .signature-box { border: 1px solid #ddd; padding: 20px; border-radius: 4px; }
        .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 10px; text-align: center; color: #666; }
        ${cssOverride}
      </style>
    </head>
    <body>
      <h1>산업안전 점검표 (Classic)</h1>
      <table class="info-table">
        <tr><th>점검일자</th><td>${date}</td><th>현장명</th><td>${siteName}</td></tr>
        <tr><th>작업내용</th><td colspan="3">${workContent}</td></tr>
        <tr><th>작업인원</th><td>${workers}</td><th>점검자</th><td>${inspector}</td></tr>
      </table>
      <table class="checklist-table">
        <tr><th style="width: 50%">점검 항목</th><th>적합</th><th>부적합</th><th>해당없음</th></tr>
        ${rows}
      </table>
      <div class="signature-section">
        <div class="signature-box"><h3>담당자</h3><div class="signature-line">${sig1Display}</div></div>
        <div class="signature-box"><h3>현장소장</h3><div class="signature-line">${sig2Display}</div></div>
      </div>
    </body>
    </html>`;
}

/**
 * TEMPLATE 2: GOVERNMENT
 */
function renderGovernment(data) {
    const { date, siteName, workContent, workers, inspector, sig1, sig2, checklist, omitItems = [] } = data;

    const items = [
        { id: "ppe_01", text: "안전모 착용 상태", value: checklist.ppe_01 || "checked" },
        { id: "fall_01", text: "고소작업 발판 설치 상태", value: checklist.fall_01 || "checked" },
        { id: "ppe_03", text: "안전대 착용 및 체결", value: checklist.ppe_03 || "checked" },
        { id: "fall_02", text: "추락방호망 설치 상태", value: checklist.fall_02 || "checked" },
        { id: "fire_01", text: "화기작업 허가서 발급", value: checklist.fire_01 || "checked" },
        { id: "fire_02", text: "소화기 적정 배치 여부", value: checklist.fire_02 || "checked" },
        { id: "conf_01", text: "밀폐공간 환기 시설", value: checklist.conf_01 || "na" },
        { id: "elec_02", text: "가설 전기 배선 상태", value: checklist.elec_02 || "checked" },
    ].filter(i => !omitItems.includes(i.id));

    const rows = items.map((item, idx) => {
        const res = item.value === 'checked' ? '양호' : (item.value === 'unchecked' ? '불량' : '해당없음');
        return `
            <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${item.text}</td>
                <td style="text-align:center;">법적 기준 준수</td>
                <td style="text-align:center;">${res}</td>
                <td></td>
            </tr>
        `;
    }).join('');

    const sig1Img = sig1 === 'present' ? `<div style="font-family: 'Brush Script MT', cursive; font-size: 24px;">${inspector} (인)</div>` : '';
    const sig2Img = sig2 === 'present' ? `<div style="font-family: 'Brush Script MT', cursive; font-size: 24px;">박현장 (인)</div>` : '';

    return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; }
        body { font-family: "Batang", serif; padding: 50px; background: #fff; }
        .container { border: 3px double #000; padding: 10px; height: 1000px; position: relative; }
        h1 { text-align: center; font-size: 28px; text-decoration: underline; margin-bottom: 30px; letter-spacing: 5px; }
        .approval-box { position: absolute; top: 10px; right: 10px; border: 1px solid #000; border-collapse: collapse; text-align: center; }
        .approval-box td { border: 1px solid #000; padding: 5px; width: 60px; height: 60px; font-size: 12px; vertical-align: bottom; }
        .approval-box th { border: 1px solid #000; background: #eee; height: 20px; font-size: 12px; }
        .main-table { width: 100%; border-collapse: collapse; margin-top: 50px; border: 2px solid #000; }
        .main-table th, .main-table td { border: 1px solid #000; padding: 8px; font-size: 14px; }
        .main-table th { background: #f8f8f8; text-align: center; }
        .check-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #000; }
        .check-table th, .check-table td { border: 1px solid #000; padding: 6px; font-size: 13px; }
        .check-table th { background: #f8f8f8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <table class="approval-box">
            <tr><th rowspan="2">결<br>재</th><th>담당</th><th>소장</th></tr>
            <tr><td>${sig1Img}</td><td>${sig2Img}</td></tr>
        </table>
        
        <h1>안 전 점 검 일 지</h1>
        
        <table class="main-table">
            <tr>
                <th width="15%">점검일자</th><td width="35%">${date}</td>
                <th width="15%">날 씨</th><td width="35%">맑음</td>
            </tr>
            <tr>
                <th>공 사 명</th><td colspan="3">${siteName}</td>
            </tr>
            <tr>
                <th>작업내용</th><td colspan="3">${workContent}</td>
            </tr>
            <tr>
                <th>참석인원</th><td colspan="3">관리감독자 외 ${workers}</td>
            </tr>
        </table>

        <div style="margin-top: 20px; font-weight: bold; font-size: 16px;">□ 점검사항</div>
        <table class="check-table">
            <thead>
                <tr>
                    <th width="5%">No</th>
                    <th width="40%">점검 항목</th>
                    <th width="20%">점검 기준</th>
                    <th width="15%">결과</th>
                    <th width="20%">조치사항</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>

        <div style="margin-top: 20px; font-weight: bold; font-size: 16px;">□ 특이사항</div>
        <div style="border: 1px solid #000; height: 100px; padding: 10px; font-size: 14px; margin-top: 5px;">
            - 금일 작업 전 TBM 실시 완료함.<br>
            - 고소작업 구간 안전대 체결 철저 지시.
        </div>
      </div>
    </body>
    </html>`;
}

/**
 * TEMPLATE 3: MOBILE
 */
function renderMobile(data) {
    const { date, siteName, checklist } = data;

    const items = [
        { id: "ppe_01", text: "안전모 착용", value: checklist.ppe_01 || "checked" },
        { id: "fall_01", text: "고소작업 (2m↑)", value: checklist.fall_01 || "checked" },
        { id: "ppe_03", text: "안전대 착용", value: checklist.ppe_03 || "checked" },
        { id: "fire_01", text: "화기작업", value: checklist.fire_01 || "checked" },
        { id: "fire_02", text: "소화기 비치", value: checklist.fire_02 || "checked" },
    ];

    const cards = items.map(item => {
        let statusColor = "#e5e7eb"; // gray
        let statusText = "확인필요";
        let icon = "⚪";

        if (item.value === 'checked') {
            statusColor = "#4ade80"; // green
            statusText = "적합";
            icon = "✅";
        } else if (item.value === 'unchecked') {
            statusColor = "#f87171"; // red
            statusText = "부적합";
            icon = "⚠️";
        } else {
            statusColor = "#d1d5db";
            statusText = "해당없음";
            icon = "➖";
        }

        return `
            <div style="background: white; padding: 15px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${item.text}</div>
                    <div style="font-size: 12px; color: #6b7280;">안전관리 기준 #12-4</div>
                </div>
                <div style="background: ${statusColor}; color: white; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; display: flex; align-items: center; gap: 4px;">
                    ${icon} ${statusText}
                </div>
            </div>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; background: #f3f4f6; }
        .app-header { background: #2563eb; padding: 20px 20px 40px 20px; color: white; }
        .status-bar { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px; opacity: 0.8; }
        .title { font-size: 20px; font-weight: bold; }
        .subtitle { font-size: 14px; opacity: 0.9; margin-top: 5px; }
        .content { padding: 20px; margin-top: -30px; }
        .info-card { background: white; padding: 15px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .label { color: #6b7280; }
        .value { font-weight: 600; color: #111; }
        .fab { position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; background: #2563eb; border-radius: 50%; box-shadow: 0 4px 12px rgba(37,99,235,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; }
      </style>
    </head>
    <body>
        <div class="app-header">
            <div class="status-bar">
                <span>9:41</span>
                <span>📶 🔋</span>
            </div>
            <div class="title">안전점검 앱</div>
            <div class="subtitle">${siteName}</div>
        </div>
        <div class="content">
            <div class="info-card">
                <div class="info-row"><span class="label">점검일자</span><span class="value">${date}</span></div>
                <div class="info-row"><span class="label">점검자</span><span class="value">김철수 Manager</span></div>
                <div class="info-row"><span class="label">진행률</span><span class="value" style="color:#2563eb">85%</span></div>
            </div>
            
            <div style="font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 10px; margin-left: 5px;">체크리스트</div>
            ${cards}
        </div>
        <div class="fab">+</div>
    </body>
    </html>`;
}

/**
 * TEMPLATE 4: BLANK (White Page)
 */
function renderBlank(data) {
    return '<!DOCTYPE html><html><body style="background: white;"></body></html>';
}

/**
 * TEST CASES
 */
const testCases = [
    // 1. Valid
    { filename: '1-valid/valid-classic.jpg', template: 'classic', options: {} },
    { filename: '1-valid/valid-govt.jpg', template: 'govt', options: {} },
    { filename: '1-valid/valid-mobile.jpg', template: 'mobile', options: {} },

    // 2. Format
    { filename: '2-stage1-format/missing-date-classic.jpg', template: 'classic', options: { date: '' } },

    // 3. Logic
    {
        filename: '3-stage2-logic/contradiction-govt.jpg', template: 'govt',
        options: { checklist: { fall_01: 'unchecked', fall_02: 'checked' } }
    },
    {
        filename: '3-stage2-logic/missing-ppe-mobile.jpg', template: 'mobile',
        options: { checklist: { fall_01: 'checked', ppe_03: 'unchecked' } }
    },

    // 7. Edge Cases
    {
        filename: '7-edge-cases/completeness-missing-helmet.jpg', template: 'classic',
        options: { omitItems: ['ppe_01'], checklist: { fall_01: 'checked' } }
    },
    {
        filename: '7-edge-cases/safety-excavation-no-shoring.jpg', template: 'classic',
        options: { workContent: '굴착 작업', checklist: { exc_01: 'checked', exc_02: 'unchecked' } }
    },
    {
        filename: '7-edge-cases/pattern-all-na.jpg', template: 'classic',
        options: { inspector: '김귀찮', checklist: { ppe_01: 'na', fall_01: 'na', elec_02: 'na' } }
    },
    {
        filename: '7-edge-cases/visual-ambiguous-input.jpg', template: 'classic',
        options: { ambiguousItems: ['ppe_01'] }
    },
    {
        filename: '7-edge-cases/context-weather-electrical.jpg', template: 'classic',
        options: { workContent: '우천시 전기작업', checklist: { elec_02: 'checked' } }
    },

    // 8. Quality Tests
    {
        filename: '8-quality-tests/quality-blurry.jpg', template: 'classic',
        options: {
            cssOverride: 'body { filter: blur(4px) contrast(0.8); }',
            workContent: '흐릿한 문서 테스트'
        }
    },
    {
        filename: '8-quality-tests/quality-empty.jpg', template: 'blank',
        options: {}
    }
];

async function generateImages() {
    console.log('Starting Image generation with Puppeteer...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const testCase of testCases) {
        const outputPath = path.join(OUTPUT_DIR, testCase.filename);

        // Default Data
        const data = {
            date: testCase.options.date !== undefined ? testCase.options.date : '2026-02-04',
            siteName: testCase.options.siteName || '테스트 건설현장',
            workContent: testCase.options.workContent || '철골 구조물 설치',
            workers: testCase.options.workers || '5명',
            inspector: testCase.options.inspector || '김철수',
            sig1: testCase.options.sig1 || 'present',
            sig2: testCase.options.sig2 || 'present',
            checklist: testCase.options.checklist || {},
            omitItems: testCase.options.omitItems || [],
            ambiguousItems: testCase.options.ambiguousItems || [],
            cssOverride: testCase.options.cssOverride || ''
        };

        let html = '';
        let viewport = { width: 1200, height: 1600 }; // Default A4-ish

        if (testCase.template === 'classic') {
            html = renderClassic(data);
        } else if (testCase.template === 'govt') {
            html = renderGovernment(data);
        } else if (testCase.template === 'mobile') {
            html = renderMobile(data);
            viewport = { width: 375, height: 812 }; // iPhone X
        } else if (testCase.template === 'blank') {
            html = renderBlank(data);
        }

        await page.setViewport(viewport);
        await page.setContent(html);

        // Ensure dir exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        console.log(`Generating: ${testCase.filename} (${testCase.template})`);
        await page.screenshot({ path: outputPath, fullPage: true, quality: 90, type: 'jpeg' });
    }

    await browser.close();
    console.log('✓ All images generated successfully!');
}

generateImages().catch(console.error);
