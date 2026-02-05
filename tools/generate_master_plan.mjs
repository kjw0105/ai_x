
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

const PLANS = [
    {
        filename: 'Master_Safety_Plan_HighRise.pdf',
        title: 'Project: Alpha Tower (High-Rise)',
        color: rgb(0, 0, 0.6),
        sections: [
            { title: '1. Working at Heights', items: ['Full-body harness required > 1.5m', 'Double-lanyard tie-off mandatory', 'Wind limit for lifting: 8 m/s'] },
            { title: '2. Crane Safety', items: ['Daily crane inspection required', 'Signalman must be present'] }
        ]
    },
    {
        filename: 'Master_Safety_Plan_General.pdf',
        title: 'Project: Beta Apartments (General)',
        color: rgb(0, 0.4, 0),
        sections: [
            { title: '1. Basic PPE', items: ['Hard hats mandatory', 'Safety vests required', 'Steel-toe boots required'] },
            { title: '2. Site Housekeeping', items: ['No materials blocking paths', 'Daily debris cleanup'] }
        ]
    },
    {
        filename: 'Master_Safety_Plan_Infrastructure.pdf',
        title: 'Project: Gamma Subway (Infrastructure)',
        color: rgb(0.5, 0.2, 0),
        sections: [
            { title: '1. Excavation', items: ['Shoring required for depth > 1.5m', 'Ladder every 7m for exit'] },
            { title: '2. Confined Space', items: ['Oxygen/Gas test required before entry', 'Ventilation fan must be active'] }
        ]
    },
    {
        filename: 'Master_Safety_Plan_Renovation.pdf',
        title: 'Project: Delta Office (Interior)',
        color: rgb(0.4, 0, 0.4),
        sections: [
            { title: '1. Fire Safety', items: ['Hot Work Permit required', 'Fire extinguisher within 3m'] },
            { title: '2. Electrical', items: ['Lockout/Tagout (LOTO) for all breaker work', 'Double-insulated tools required'] }
        ]
    }
];

async function createPlan(config) {
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Cover Page
    const page1 = pdfDoc.addPage();
    const { width, height } = page1.getSize();

    page1.drawText('MASTER SAFETY PLAN', { x: 150, y: height - 200, size: 30, font: timesBold, color: config.color });
    page1.drawText(config.title, { x: 180, y: height - 250, size: 18, font: timesRoman });
    page1.drawText('Date: 2026-02-05', { x: 250, y: height - 280, size: 14, font: timesRoman });

    // Content Page
    const page2 = pdfDoc.addPage();
    let y = height - 50;
    const margin = 50;

    for (const section of config.sections) {
        if (y < 100) { page2.addPage(); y = height - 50; }

        y -= 30;
        page2.drawText(section.title, { x: margin, y, size: 18, font: timesBold, color: config.color });
        y -= 20;

        for (const item of section.items) {
            page2.drawText(`• ${item}`, { x: margin + 10, y, size: 12, font: timesRoman });
            y -= 15;
        }
    }

    const pdfBytes = await pdfDoc.save();
    try {
        fs.writeFileSync(config.filename, pdfBytes);
        console.log(`✅ Generated ${config.filename}`);
    } catch (e) {
        console.error(`❌ Failed to write ${config.filename}:`, e);
    }
}

async function generateAll() {
    console.log("Starting PDF generation...");
    for (const plan of PLANS) {
        await createPlan(plan);
    }
    console.log("PDF generation complete.");
}

generateAll().catch(console.error);
