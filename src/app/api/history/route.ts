
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            // Fetch specific report
            const report = await prisma.report.findUnique({
                where: { id }
            });
            if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
            return NextResponse.json(report);
        }

        // Fetch list (top 100, filtered by project if specified)
        const projectId = searchParams.get("projectId");

        const reports = await prisma.report.findMany({
            where: projectId ? { projectId } : undefined,
            take: 100,
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(reports);
    } catch (e: any) {
        console.error("History Error:", e);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            await prisma.report.delete({ where: { id } });
        } else {
            await prisma.report.deleteMany({});
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, projectId, fileName, summary, transcript, tbmDuration,
                workType, extractedHazards, extractedInspector, participants } = body;

        if (type === "TBM") {
            const report = await prisma.report.create({
                data: {
                    fileName: fileName || "TBM(작업 전 대화)",
                    projectId: projectId || null,
                    tbmSummary: summary || "",
                    tbmTranscript: transcript || "",
                    tbmDuration: tbmDuration || 0,
                    tbmWorkType: workType || null,
                    tbmExtractedHazards: extractedHazards || null,
                    tbmExtractedInspector: extractedInspector || null,
                    tbmParticipants: participants || null,
                    documentType: "TBM",
                    docDataJson: "{}",
                    issuesJson: "[]",
                    chatJson: JSON.stringify([{ role: "ai", text: summary || "" }]),
                }
            });
            return NextResponse.json(report);
        }

        // Regular document logic (if needed in future)
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    } catch (e: any) {
        console.error("History POST Error:", e);
        return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
    }
}
