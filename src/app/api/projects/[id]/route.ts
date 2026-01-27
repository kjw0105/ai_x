export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE: Delete a project and nullify its references in reports
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id;

        // Check if project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // First, nullify projectId for all reports associated with this project
        // This preserves historical data while removing the project reference
        await prisma.report.updateMany({
            where: { projectId: projectId },
            data: { projectId: null }
        });

        // Now delete the project
        await prisma.project.delete({
            where: { id: projectId }
        });

        return NextResponse.json({ success: true, message: "Project deleted successfully" });
    } catch (e: any) {
        console.error("Error deleting project:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// GET: Get a single project with full context
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id;

        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
