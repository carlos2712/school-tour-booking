import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL, ADMIN_EMAIL } from "@/lib/resend";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { AdminNotificationEmail } from "@/emails/admin-notification";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { format } from "date-fns";

const performanceSchema = z.object({
  showDateId: z.string().min(1),
  venueLocation: z.string().min(1),
  preferredAlternateDate: z.string().optional(),
  customTime: z.string().optional(),
});

const bookingSchema = z.object({
  showId: z.string().min(1),
  schoolName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  grades: z.string().min(1),
  studentCount: z.number().min(1).max(200),
  performanceCount: z.number().min(1).max(2),
  paymentOption: z.enum(["FREE", "PAY_WHAT_YOU_CAN", "FULL_FEE"]),
  paymentAmount: z.number().optional(),
  notes: z.string().optional(),
  customAnswers: z.record(z.string(), z.unknown()).optional(),
  performances: z.array(performanceSchema).min(1).max(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = bookingSchema.parse(body);

    // Verify all show dates belong to the show and are available
    const showDates = await prisma.showDate.findMany({
      where: {
        id: { in: data.performances.map((p) => p.showDateId) },
        showId: data.showId,
        isAvailable: true,
        isBooked: false,
      },
    });

    if (showDates.length !== data.performances.length) {
      return NextResponse.json(
        { error: "One or more selected dates are no longer available." },
        { status: 409 }
      );
    }

    // Create booking + mark dates as booked in a transaction
    const bookingId = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          showId: data.showId,
          schoolName: data.schoolName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          grades: data.grades,
          studentCount: data.studentCount,
          performanceCount: data.performanceCount,
          paymentOption: data.paymentOption,
          paymentAmount: data.paymentAmount,
          notes: data.notes,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customAnswers: (data.customAnswers ?? {}) as any,
          performances: {
            create: data.performances.map((p) => ({
              showDateId: p.showDateId,
              venueLocation: p.venueLocation,
              preferredAlternateDate: p.preferredAlternateDate
                ? new Date(p.preferredAlternateDate)
                : null,
              customTime: p.customTime,
            })),
          },
        },
      });

      await tx.showDate.updateMany({
        where: { id: { in: data.performances.map((p) => p.showDateId) } },
        data: { isBooked: true },
      });

      return booking.id;
    });

    // Fetch full booking after transaction for email
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: {
        show: true,
        performances: { include: { showDate: true } },
      },
    });

    const performanceDetails = booking.performances.map((p) => ({
      date: format(new Date(p.showDate.date), "EEEE, MMMM d, yyyy"),
      timeSlot: p.showDate.timeSlot,
      venueLocation: p.venueLocation,
      customTime: p.customTime ?? undefined,
    }));

    await Promise.allSettled([
      resend.emails.send({
        from: FROM_EMAIL,
        to: booking.email,
        subject: `Booking Confirmed: ${booking.show.title}`,
        react: BookingConfirmationEmail({
          contactName: booking.contactName,
          schoolName: booking.schoolName,
          showTitle: booking.show.title,
          performances: performanceDetails,
          bookingId: booking.id,
          paymentOption: booking.paymentOption,
          paymentAmount: booking.paymentAmount ?? undefined,
          fullFeeAmount: booking.show.fullFeeAmount,
        }),
      }),
      resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `New Booking: ${booking.schoolName} — ${booking.show.title}`,
        react: AdminNotificationEmail({
          booking: {
            id: booking.id,
            schoolName: booking.schoolName,
            contactName: booking.contactName,
            email: booking.email,
            phone: booking.phone,
            grades: booking.grades,
            studentCount: booking.studentCount,
            paymentOption: booking.paymentOption,
            paymentAmount: booking.paymentAmount ?? undefined,
            notes: booking.notes ?? undefined,
          },
          showTitle: booking.show.title,
          performances: performanceDetails,
        }),
      }),
    ]);

    return NextResponse.json({ id: booking.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid booking data" }, { status: 400 });
    }
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    include: {
      show: { select: { title: true } },
      performances: { include: { showDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}
