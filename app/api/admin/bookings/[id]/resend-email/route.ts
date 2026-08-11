import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { BookingConfirmationEmail } from "@/emails/booking-confirmation";
import { format } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        show: true,
        performances: { include: { showDate: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

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

    const { data, error } = await resend.emails.send({
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
    });

    if (error) {
      console.error("Resend error re-sending confirmation:", error);
      return NextResponse.json(
        { error: error.message || "Failed to send email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error resending confirmation email:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to resend confirmation email." },
      { status: 500 }
    );
  }
}
