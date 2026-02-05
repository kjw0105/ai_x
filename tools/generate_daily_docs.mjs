
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

const DOCS = [
    {
        filename: 'Daily_Checklist_Sample.pdf',
        title: 'Daily Safety Inspection Log (산업안전 점검표)',
        subtitle: 'Date: 2026-02-05 | Site: Alpha Tower | Inspector: Kim Safety',
        sections: [
            { title: '1. PPE Check', items: ['[x] Helmet worn properly', '[x] Safety shoes worn', '[ ] Safety vest worn (Missing)'] },
            { title: '2. Equipment', items: ['[x] Ladder condition good', '[x] Power tools grounded'] },
            { title: '3. Environment', items: ['[x] Pathways clear', '[x] Lighting adequate'] }
        ],
        footer: 'Signature: Kim Safety (Signed)'
    },
    {
        filename: 'Risk_Assessment_Sample.pdf',
        title: 'Risk Assessment Report (위험성 평가 보고서)',
        subtitle: 'Date: 2026-02-05 | Activity: 3rd Floor Slab Pouring',
        sections: [
            { title: 'Identified Risks', items: ['- Fall from height (High Risk)', '- Concrete burns (Medium Risk)'] },
            { title: 'Mitigation Measures', items: ['- Install guardrails', '- Wear rubber gloves and boots'] }
        ],
        footer: 'Supervisor Approval: Lee Manager (Signed)'
    },
    {
        filename: 'PreWork_Checklist_Sample.pdf',
        title: 'Pre-Work Safety Check (작업 전 안전점검표)',
        subtitle: 'Date: 2026-02-05 | Team: Electric Team A',
        sections: [
            { title: 'Worker Health', items: ['[x] Blood pressure normal', '[x] No alcohol detected'] },
            { title: 'Tool Check', items: ['[x] Insulation gloves checked', '[x] Multi-meter functional'] }
        ],
        footer: 'Team Leader: Park Electric (Signed)'
    },
    {
        filename: 'TBM_Log_Sample.pdf',
        title: 'Tool Box Meeting Log (TBM)',
        subtitle: 'Date: 2026-02-05 07:00 AM | Topic: Crane Safety',
        sections: [
            { title: 'Topics Discussed', items: ['- Stay clear of swing radius', '- Signalman communication signals'] },
            { title: 'Attendees', items: ['- Kim Chul-soo', '- Park Young-hee', '- Lee Min-ho'] }
        ],
        footer: 'Conducted By: Choi Foreman (Signed)'
    }
];

async function createDoc(config) {
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let y = height - 50;
    const margin = 50;

    // Title
    page.drawText(config.title, { x: margin, y, size: 24, font: timesBold, color: rgb(0, 0, 0) });
    y -= 30;
    page.drawText(config.subtitle, { x: margin, y, size: 12, font: timesRoman, color: rgb(0.4, 0.4, 0.4) });
    y -= 40;

    // Sections
    for (const section of config.sections) {
        page.drawText(section.title, { x: margin, y, size: 16, font: timesBold, color: rgb(0, 0, 0.6) });
        y -= 20;
        for (const item of section.items) {
            page.drawText(item, { x: margin + 10, y, size: 12, font: timesRoman });
            y -= 15;
        }
        y -= 10;
    }

    // Footer (Signature)
    y -= 30;
    page.drawText(config.footer, { x: margin, y, size: 14, font: timesRoman, color: rgb(0.6, 0, 0) });

    const pdfBytes = await pdfDoc.save();
    try {
        fs.writeFileSync(config.filename, pdfBytes);
        console.log(`✅ Generated ${config.filename}`);
    } catch (e) {
        console.error(`❌ Failed to write ${config.filename}:`, e);
    }
}

async function generateAll() {
    console.log("Starting Daily Docs generation...");
    for (const doc of DOCS) {
        await createDoc(doc);
    }
    console.log("Daily Docs generation complete.");
}

generateAll().catch(console.error);
