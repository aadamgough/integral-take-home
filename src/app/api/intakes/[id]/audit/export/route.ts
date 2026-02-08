import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getAuditActionLabel } from "@/lib/constants";
import { escapeCSVField, formatDateForCSV } from "@/lib/utils";

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

    if (user.role !== "REVIEWER") {
      return NextResponse.json(
        { error: "Only reviewers can export audit logs" },
        { status: 403 }
      );
    }

    const intake = await prisma.intake.findUnique({
      where: { id },
      include: {
        auditLogs: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    const headers = ["Timestamp", "Activity", "Reviewer Name", "Reviewer Email", "Details"];
    const csvRows = [headers.join(",")];

    for (const log of intake.auditLogs) {
      const row = [
        escapeCSVField(formatDateForCSV(log.createdAt.toISOString())),
        escapeCSVField(getAuditActionLabel(log.action)),
        escapeCSVField(log.user.name),
        escapeCSVField(log.user.email),
        escapeCSVField(log.details || ""),
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");

    const date = new Date().toISOString().split("T")[0];
    const filename = `audit-log-${id}-${date}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
