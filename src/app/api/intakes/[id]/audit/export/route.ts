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

function getAuditActionLabel(action: string): string {
  const actions: Record<string, string> = {
    CREATED: "Application Submitted",
    VIEWED: "Viewed",
    STATUS_CHANGED: "Status Changed",
    DOCUMENT_UPLOADED: "Document Uploaded",
    DOCUMENT_DELETED: "Document Deleted",
    ASSIGNED: "Assigned",
    VIEW_MODE_PRIVILEGED: "Viewed Full PII",
    VIEW_MODE_REDACTED: "Switched to Redacted",
  };
  return actions[action] || action;
}

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatDateForCSV(dateString: string): string {
  return new Date(dateString).toISOString();
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
