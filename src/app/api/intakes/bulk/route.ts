import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "REVIEWER") {
      return NextResponse.json(
        { error: "Only reviewers can bulk update intakes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { intakeIds, status } = body;

    if (!Array.isArray(intakeIds) || intakeIds.length === 0) {
      return NextResponse.json(
        { error: "intakeIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const existingIntakes = await prisma.intake.findMany({
      where: { id: { in: intakeIds } },
      select: { id: true, status: true },
    });

    if (existingIntakes.length === 0) {
      return NextResponse.json(
        { error: "No intakes found with the provided IDs" },
        { status: 404 }
      );
    }

    const intakesToUpdate = existingIntakes.filter(
      (intake: { status: string }) => intake.status !== status
    );

    if (intakesToUpdate.length === 0) {
      return NextResponse.json({
        message: "No intakes needed status change",
        updated: 0,
        skipped: existingIntakes.length,
      });
    }

    const updateResult = await prisma.intake.updateMany({
      where: { 
        id: { in: intakesToUpdate.map((i: { id: string }) => i.id) },
      },
      data: { 
        status,
        reviewerId: user.id,
      },
    });

    const auditLogData = intakesToUpdate.map((intake: { id: string; status: string }) => ({
      action: AUDIT_ACTIONS.STATUS_CHANGED,
      details: JSON.stringify({
        previousStatus: intake.status,
        newStatus: status,
        bulkAction: true,
      }),
      userId: user.id,
      intakeId: intake.id,
    }));

    await prisma.auditLog.createMany({
      data: auditLogData,
    });

    return NextResponse.json({
      message: `Successfully updated ${updateResult.count} intake(s)`,
      updated: updateResult.count,
      skipped: existingIntakes.length - intakesToUpdate.length,
    });
  } catch (error) {
    console.error("Error bulk updating intakes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
