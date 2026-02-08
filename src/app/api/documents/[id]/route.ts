import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        intake: {
          select: { submittedById: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (user.role === "PATIENT" && document.intake.submittedById !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const filePath = path.join(process.cwd(), document.filePath);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Type": document.fileType,
          "Content-Disposition": `inline; filename="${document.fileName}"`,
          "Content-Length": document.fileSize.toString(),
        },
      });
    } catch {
      return NextResponse.json({ error: "File not found on server" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
