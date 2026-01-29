
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
                contextText: true, // Include to show indicator if master doc exists
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
