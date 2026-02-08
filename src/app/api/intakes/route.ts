import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const whereClause = user.role === "PATIENT" 
      ? { submittedById: user.id }
      : {};

    const intakes = await prisma.intake.findMany({
      where: whereClause,
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        documents: true,
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(intakes);
  } catch (error) {
    console.error("Error fetching intakes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can submit intakes" }, { status: 403 });
    }

    const body = await request.json();
    const { clientName, clientEmail, clientPhone, dateOfBirth, ssn, description, notes } = body;

    if (!clientName || !clientEmail || !clientPhone || !dateOfBirth || !ssn || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const intake = await prisma.intake.create({
      data: {
        clientName,
        clientEmail,
        clientPhone,
        dateOfBirth,
        ssn,
        description,
        notes: notes || null,
        submittedById: user.id,
      },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
        documents: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATED",
        details: JSON.stringify({ intakeId: intake.id }),
        userId: user.id,
        intakeId: intake.id,
      },
    });

    return NextResponse.json(intake, { status: 201 });
  } catch (error) {
    console.error("Error creating intake:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
