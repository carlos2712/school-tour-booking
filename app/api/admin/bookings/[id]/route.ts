import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  return !!session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, freeSlots } = z
    .object({
      status: z.enum(["CONFIRMED", "CANCELLED", "MODIFIED"]),
      freeSlots: z.boolean().default(false),
    })
    .parse(body);

  await prisma.$transaction(
    async (tx) => {
      await tx.booking.update({ where: { id }, data: { status } });

      if (freeSlots && status === "CANCELLED") {
        const performances = await tx.bookingPerformance.findMany({
          where: { bookingId: id },
        });
        await tx.showDate.updateMany({
          where: { id: { in: performances.map((p) => p.showDateId) } },
          data: { isBooked: false },
        });
      }
    },
    { maxWait: 10000, timeout: 20000 }
  );

  return NextResponse.json({ success: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    include: {
      show: true,
      performances: { include: { showDate: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(booking);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id, deletedAt: null },
    include: { performances: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.booking.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: "CANCELLED",
        },
      });

      if (booking.performances.length > 0) {
        const showDateIds = booking.performances.map((p) => p.showDateId);
        await tx.showDate.updateMany({
          where: { id: { in: showDateIds } },
          data: { isBooked: false },
        });
      }
    },
    { maxWait: 10000, timeout: 20000 }
  );

  return NextResponse.json({ success: true, message: "Booking soft deleted" });
}
