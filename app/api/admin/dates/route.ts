import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  return !!session;
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = z
    .object({
      showId: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      timeSlot: z.enum(["AM", "PM"]),
    })
    .parse(body);

  try {
    const showDate = await prisma.showDate.create({
      data: {
        showId: data.showId,
        date: new Date(data.date + "T12:00:00Z"),
        timeSlot: data.timeSlot,
        isAvailable: true,
        isBooked: false,
      },
    });
    return NextResponse.json({
      id: showDate.id,
      date: showDate.date.toISOString(),
      timeSlot: showDate.timeSlot,
      isAvailable: showDate.isAvailable,
      isBooked: showDate.isBooked,
    });
  } catch {
    return NextResponse.json(
      { error: "Slot already exists for this date and time." },
      { status: 409 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { isAvailable } = await req.json();
  const updated = await prisma.showDate.update({
    where: { id },
    data: { isAvailable },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const slot = await prisma.showDate.findUnique({ where: { id } });
  if (slot?.isBooked) {
    return NextResponse.json(
      { error: "Cannot delete a booked slot" },
      { status: 400 }
    );
  }

  await prisma.showDate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
