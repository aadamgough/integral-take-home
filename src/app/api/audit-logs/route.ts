import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "REVIEWER") {
      return NextResponse.json(
        { error: "Only reviewers can view audit logs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "all";
    const reviewer = searchParams.get("reviewer") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build the where clause for filtering
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
        // Only add a day if it's a date-only string (YYYY-MM-DD format)
        // ISO timestamps already include the exact time
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

    const reviewers = await prisma.user.findMany({
      where: { role: "REVIEWER" },
      select: { id: true, name: true, email: true },
    });

    const actionTypes = await prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
    });

    return NextResponse.json({
      auditLogs,
      reviewers,
      actionTypes: actionTypes.map((a: { action: string }) => a.action),
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
