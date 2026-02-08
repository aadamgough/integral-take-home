import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

function formatDateForCSV(date: Date): string {
  return date.toISOString();
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "all";
    const reviewer = searchParams.get("reviewer") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build the where clause for filtering (same as GET /api/audit-logs)
    const where: {
      action?: string;
      userId?: string;
      createdAt?: { gte?: Date; lte?: Date };
      OR?: Array<{
        action?: { contains: string };
        user?: { name?: { contains: string }; email?: { contains: string } };
        intake?: { clientName?: { contains: string }; id?: { contains: string } };
      }>;
    } = {};

    if (action && action !== "all") {
      where.action = action;
    }

    if (reviewer && reviewer !== "all") {
      where.userId = reviewer;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        if (endDate.length === 10) {
          end.setDate(end.getDate() + 1);
        }
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { intake: { clientName: { contains: search } } },
        { intake: { id: { contains: search } } },
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        intake: {
          select: { id: true, clientName: true, clientEmail: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Timestamp",
      "Activity",
      "Reviewer Name",
      "Reviewer Email",
      "Application ID",
      "Patient Name",
      "Application Status",
      "Details",
    ];
    const csvRows = [headers.join(",")];

    for (const log of auditLogs) {
      const row = [
        escapeCSVField(formatDateForCSV(log.createdAt)),
        escapeCSVField(getAuditActionLabel(log.action)),
        escapeCSVField(log.user.name),
        escapeCSVField(log.user.email),
        escapeCSVField(log.intake.id),
        escapeCSVField(log.intake.clientName),
        escapeCSVField(log.intake.status),
        escapeCSVField(log.details || ""),
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");

    const date = new Date().toISOString().split("T")[0];
    const filename = `audit-trail-${date}.csv`;

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
