
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

        // Fetch list (top 20)
        const reports = await prisma.report.findMany({
            take: 20,
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(reports);
    } catch (e: any) {
        console.error("History Error:", e);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
