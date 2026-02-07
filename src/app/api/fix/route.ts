
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize AI Clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

export async function POST(req: NextRequest) {
    try {
        const { issue, fileType, fileData, pdfText } = await req.json();

        if (!issue) return NextResponse.json({ error: "No issue provided" }, { status: 400 });

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                error: "OpenAI API Key가 설정되지 않았습니다. .env.local 파일을 확인해주세요.",
                solution: "Please set OPENAI_API_KEY in .env.local"
            }, { status: 500 });
        }

        // Strategy A: Direct PDF Fix (if it's a PDF)
        if (fileType === "application/pdf" && fileData) {
            try {
                // 1. Ask AI for the fix coordination
                const fixPrompt = `
                I have a PDF document text:
                "${pdfText?.slice(0, 2000)}..."
                
                The user found this issue: "${issue.message}".
                
                Please provide the EXACT text to replace in the PDF, and the new text.
                Format as JSON: { "targetText": "string", "replacementText": "string" }
                `;

                const aiResponse = await openai.chat.completions.create({
                    model: "gpt-5.1",
                    messages: [{ role: "user", content: fixPrompt }],
                    response_format: { type: "json_object" }
                });

                const fixData = JSON.parse(aiResponse.choices[0].message.content || "{}");

                if (fixData.targetText && fixData.replacementText) {
                    // 2. Apply fix using pdf-lib (Simplified: Append for now as search/replace is hard in PDF)
                    // Better approach: Create a visual overlay or annotation
                    const pdfDoc = await PDFDocument.load(fileData);
                    const pages = pdfDoc.getPages();
                    const firstPage = pages[0]; // Simplified: Assume first page for demo

                    // Add a "FIXED" annotation stamp
                    const { width, height } = firstPage.getSize();
                    firstPage.drawText(`FIX APPLIED: ${fixData.replacementText}`, {
                        x: 50,
                        y: height - 50,
                        size: 12,
                        color: rgb(0, 0.5, 0),
                    });

                    const pdfBytes = await pdfDoc.save();
                    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

                    return NextResponse.json({
                        success: true,
                        type: "pdf_fix",
                        fixedPdf: `data:application/pdf;base64,${pdfBase64}`,
                        message: "PDF patched with annotation."
                    });
                }
            } catch (e) {
                console.error("PDF Fix failed:", e);
                // Fallback to text suggestion
            }
        }

        // Strategy B: Text Suggestion (Default)
        const suggestionPrompt = `
        The user has a document validation issue:
        Title: ${issue.title}
        Message: ${issue.message}
        
        Provide a corrected text snippet that resolves this issue. 
        Return ONLY the corrected text, no conversational filler.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-5.1",
            messages: [{ role: "user", content: suggestionPrompt }]
        });

        return NextResponse.json({
            success: true,
            type: "suggestion",
            suggestion: response.choices[0].message.content
        });

    } catch (error: any) {
        console.error("Fix API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
