import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const skipAudit = searchParams.get("skipAudit") === "true";

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const intake = await prisma.intake.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        auditLogs: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    if (user.role === "PATIENT" && intake.submittedBy.id !== user.id) {
      return NextResponse.json({ error: "You don't have permission to view this intake" }, { status: 403 });
    }

    if (user.role === "REVIEWER" && !skipAudit) {
      await prisma.auditLog.create({
        data: {
          action: "VIEWED",
          details: JSON.stringify({ viewedBy: user.name }),
          userId: user.id,
          intakeId: intake.id,
        },
      });
    }

    return NextResponse.json(intake);
  } catch (error) {
    console.error("Error fetching intake:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "REVIEWER") {
      return NextResponse.json({ error: "Only reviewers can update intakes" }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes } = body;

    const existingIntake = await prisma.intake.findUnique({
      where: { id },
    });

    if (!existingIntake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    const updateData: { status?: string; notes?: string; reviewerId?: string } = {};
    const auditDetails: { previousStatus?: string; newStatus?: string; notes?: string } = {};

    if (status && status !== existingIntake.status) {
      updateData.status = status;
      updateData.reviewerId = user.id;
      auditDetails.previousStatus = existingIntake.status;
      auditDetails.newStatus = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
      auditDetails.notes = "Notes updated";
    }

    const intake = await prisma.intake.update({
      where: { id },
      data: updateData,
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        documents: true,
      },
    });

    if (auditDetails.newStatus) {
      await prisma.auditLog.create({
        data: {
          action: "STATUS_CHANGED",
          details: JSON.stringify(auditDetails),
          userId: user.id,
          intakeId: intake.id,
        },
      });
    }

    return NextResponse.json(intake);
  } catch (error) {
    console.error("Error updating intake:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
