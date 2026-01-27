
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: List all projects
export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                // Don't return the huge contextText by default unless needed, to save bandwidth
                // But for simplicity/small scale, returning it is fine? 
                // Let's exclude it for list view if it gets huge.
                // Actually Prisma select makes this easy.
            }
        });
        return NextResponse.json(projects);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: Create a new project with Context
export async function POST(req: Request) {
    try {
        const { name, description, contextText } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                contextText: contextText ?? ""
            }
        });

        return NextResponse.json(project);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
