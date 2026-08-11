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
  studentCount: z.number().min(1).max(2000),
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
  performanceCount: z.number().min(1).max(2),
  paymentOption: z.enum(["PINELLAS_COUNTY", "HILLSBOROUGH_COUNTY", "INDEPENDENT_PRIVATE", "PAY_WHAT_YOU_CAN"]),
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

    const show = await prisma.show.findUnique({
      where: { id: data.showId },
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found." }, { status: 404 });
    }

    for (const p of data.performances) {
      if (p.studentCount > show.maxStudents) {
        return NextResponse.json(
          { error: `Student count exceeds max allowed (${show.maxStudents}).` },
          { status: 400 }
        );
      }
    }

    // Create booking + mark dates as booked in a transaction
    const bookingId = await prisma.$transaction(
      async (tx) => {
        const booking = await tx.booking.create({
          data: {
            showId: data.showId,
            schoolName: data.schoolName,
            contactName: data.contactName,
            email: data.email,
            phone: data.phone,
            grades: data.grades,
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
                studentCount: p.studentCount,
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
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

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
      studentCount: p.studentCount,
      customTime: p.customTime ?? undefined,
      preferredAlternateDate: p.preferredAlternateDate
        ? format(new Date(p.preferredAlternateDate), "EEEE, MMMM d, yyyy")
        : undefined,
    }));

    // Fetch configured admin notification recipients
    const adminEmailSetting = await prisma.setting.findUnique({
      where: { key: "admin_notification_emails" },
    });

    let adminEmails: string[] = [];
    if (adminEmailSetting?.value) {
      try {
        const parsed = JSON.parse(adminEmailSetting.value);
        if (Array.isArray(parsed)) {
          adminEmails = parsed.map((e) => String(e).trim()).filter(Boolean);
        }
      } catch {
        adminEmails = adminEmailSetting.value
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean);
      }
    }

    if (adminEmails.length === 0 && ADMIN_EMAIL) {
      adminEmails = [ADMIN_EMAIL];
    }

    const emailPromises: Promise<any>[] = [
      resend.emails.send({
        from: FROM_EMAIL,
        to: booking.email,
        subject: `American Stage School Tour booking Confirmation: ${booking.show.title}`,
        react: BookingConfirmationEmail({
          contactName: booking.contactName,
          schoolName: booking.schoolName,
          showTitle: booking.show.title,
          performances: performanceDetails,
          bookingId: booking.id,
          paymentOption: booking.paymentOption,
          paymentAmount: booking.paymentAmount ?? undefined,
          fullFeeAmount: booking.show.fullFeeAmount,
          phone: booking.phone,
          grades: booking.grades,
          notes: booking.notes ?? undefined,
        }),
      }),
    ];

    if (adminEmails.length > 0) {
      emailPromises.push(
        resend.emails.send({
          from: FROM_EMAIL,
          to: adminEmails,
          subject: `New Booking: ${booking.schoolName} — ${booking.show.title}`,
          react: AdminNotificationEmail({
            booking: {
              id: booking.id,
              schoolName: booking.schoolName,
              contactName: booking.contactName,
              email: booking.email,
              phone: booking.phone,
              grades: booking.grades,
              paymentOption: booking.paymentOption,
              paymentAmount: booking.paymentAmount ?? undefined,
              notes: booking.notes ?? undefined,
            },
            showTitle: booking.show.title,
            performances: performanceDetails,
          }),
        })
      );
    }

    const results = await Promise.allSettled(emailPromises);
    results.forEach((res, index) => {
      if (res.status === "rejected") {
        console.error(`Email error for promise ${index}:`, res.reason);
      }
    });

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
