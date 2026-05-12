import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { BookingActions } from "./booking-actions";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      show: true,
      performances: {
        include: { showDate: true },
        orderBy: { showDate: { date: "asc" } },
      },
    },
  });

  if (!booking) notFound();

  const paymentLabel =
    booking.paymentOption === "FREE"
      ? "Free Performance"
      : booking.paymentOption === "PAY_WHAT_YOU_CAN"
      ? `Pay What You Can${booking.paymentAmount ? ` — $${booking.paymentAmount}` : ""}`
      : `Full Fee — $${booking.show.fullFeeAmount}`;

  const customAnswers = booking.customAnswers as Record<string, unknown>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/bookings" className="text-gray-500 hover:text-gold text-sm">
          ← Bookings
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-600 text-sm truncate">{booking.schoolName}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{booking.schoolName}</h1>
          <p className="text-gray-600 text-sm mt-1">
            Booked {format(new Date(booking.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <Badge
          variant={
            booking.status === "CONFIRMED"
              ? "confirmed"
              : booking.status === "CANCELLED"
              ? "cancelled"
              : "modified"
          }
          className="text-sm px-3 py-1"
        >
          {booking.status}
        </Badge>
      </div>

      <div className="space-y-5">
        {/* Contact */}
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h2 className="text-gold font-semibold mb-4">Contact Information</h2>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <Field label="School" value={booking.schoolName} />
            <Field label="Contact" value={booking.contactName} />
            <Field label="Email" value={<a href={`mailto:${booking.email}`} className="text-gold hover:underline">{booking.email}</a>} />
            <Field label="Phone" value={<a href={`tel:${booking.phone}`} className="text-gold hover:underline">{booking.phone}</a>} />
            <Field label="Grades" value={booking.grades} />
          </dl>
        </section>

        {/* Performances */}
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h2 className="text-gold font-semibold mb-4">
            Performance{booking.performances.length > 1 ? "s" : ""}
          </h2>
          <div className="space-y-4">
            {booking.performances.map((perf: any, i: number) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <p className="text-foreground font-medium">
                  {format(new Date(perf.showDate.date), "EEEE, MMMM d, yyyy")} —{" "}
                  <span className="text-gold">{perf.showDate.timeSlot}</span>
                  {perf.customTime && <span className="text-gray-600 text-sm ml-2">(Requested: {perf.customTime})</span>}
                </p>
                <p className="text-gray-600 text-sm mt-1">{perf.venueLocation}</p>
                <p className="text-gray-600 text-sm mt-1">Students: {perf.studentCount}</p>
                {perf.preferredAlternateDate && (
                  <p className="text-gray-500 text-xs mt-1">
                    Preferred alternate: {format(new Date(perf.preferredAlternateDate), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Payment */}
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h2 className="text-gold font-semibold mb-3">Payment</h2>
          <p className="text-foreground text-sm">{paymentLabel}</p>
        </section>

        {/* Custom answers */}
        {Object.keys(customAnswers).length > 0 && (
          <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h2 className="text-gold font-semibold mb-4">Additional Information</h2>
            <dl className="space-y-3 text-sm">
              {Object.entries(customAnswers).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-gray-500">{key}</dt>
                  <dd className="text-foreground">
                    {Array.isArray(value) ? value.join(", ") : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Notes */}
        {booking.notes && (
          <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h2 className="text-gold font-semibold mb-3">Notes</h2>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{booking.notes}</p>
          </section>
        )}

        {/* Admin actions */}
        <BookingActions
          bookingId={booking.id}
          currentStatus={booking.status}
          performances={booking.performances.map((p) => ({
            showDateId: p.showDateId,
            isBooked: p.showDate.isBooked,
          }))}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-gray-600 text-xs mb-0.5">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
