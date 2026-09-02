import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { BookingFormWrapper, InitialBookingData } from "@/components/booking-form-wrapper";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ModifyBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      performances: { include: { showDate: true } },
    },
  });

  if (!booking) {
    notFound();
  }

  const show = await prisma.show.findUnique({
    where: { id: booking.showId },
    include: {
      customQuestions: { orderBy: { order: "asc" } },
      dates: {
        where: {
          OR: [
            { isAvailable: true, isBooked: false },
            { id: { in: booking.performances.map(p => p.showDateId) } }
          ]
        },
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      },
    },
  });

  if (!show) {
    notFound();
  }

  const isSameDay = booking.performances.length === 2 && 
    booking.performances[0].showDate.date.getTime() === booking.performances[1].showDate.date.getTime();

  const initialPerformances = isSameDay 
    ? [{
        selectedDateStr: booking.performances[0].showDate.date.toISOString().split("T")[0],
        showDateId: booking.performances.find(p => p.showDate.timeSlot === "AM")?.showDateId ?? "",
        venueLocation: booking.performances[0].venueLocation,
        studentCount: booking.performances[0].studentCount.toString(),
        customTime: booking.performances.find(p => p.showDate.timeSlot === "AM")?.customTime ?? undefined,
        pmCustomTime: booking.performances.find(p => p.showDate.timeSlot === "PM")?.customTime ?? undefined,
      }]
    : booking.performances.map(p => ({
        selectedDateStr: p.showDate.date.toISOString().split("T")[0],
        showDateId: p.showDateId,
        venueLocation: p.venueLocation,
        studentCount: p.studentCount.toString(),
        preferredAlternateDate: p.preferredAlternateDate ? p.preferredAlternateDate.toISOString().split("T")[0] : undefined,
        customTime: p.customTime ?? undefined,
        pmCustomTime: undefined,
      }));

  const initialData: InitialBookingData = {
    id: booking.id,
    contact: {
      schoolName: booking.schoolName,
      contactName: booking.contactName,
      email: booking.email,
      phone: booking.phone,
      address: booking.address ?? "",
      grades: booking.grades,
    },
    performanceCount: booking.performanceCount as 1 | 2,
    sameDay: isSameDay,
    performances: initialPerformances,
    paymentOption: booking.paymentOption,
    paymentAmount: booking.paymentAmount?.toString() ?? "",
    notes: booking.notes ?? "",
    customAnswers: (booking.customAnswers as Record<string, string | string[]>) ?? {},
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section id="booking" className="max-w-3xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Modify Reservation
          </h2>
          <p className="text-gray-600 mb-10">
            Update your booking details below. Changes will be saved immediately.
          </p>
          <BookingFormWrapper
            isModification={true}
            initialData={initialData}
            show={{
              id: show.id,
              title: show.title,
              fullFeeAmount: show.fullFeeAmount,
              enablePinellasCounty: show.enablePinellasCounty,
              enableHillsboroughCounty: show.enableHillsboroughCounty,
              enableManateeCounty: show.enableManateeCounty,
              enableIndependentPrivate: show.enableIndependentPrivate,
              enablePwyw: show.enablePwyw,
              amStartTime: show.amStartTime,
              amEndTime: show.amEndTime,
              pmStartTime: show.pmStartTime,
              pmEndTime: show.pmEndTime,
              maxStudents: show.maxStudents,
              doubleBookingDiscountPercent: show.doubleBookingDiscountPercent,
            }}
            availableDates={show.dates.map((d) => ({
              id: d.id,
              date: d.date.toISOString(),
              timeSlot: d.timeSlot,
              isBooked: false, // We spoof isBooked: false for all dates passed to the form so they appear selectable
            }))}
            customQuestions={show.customQuestions.map((q) => ({
              id: q.id,
              text: q.text,
              type: q.type,
              options: q.options,
              isRequired: q.isRequired,
            }))}
          />
        </section>
      </main>
      <footer className="border-t border-navy-light py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} American Stage. All rights reserved.
      </footer>
    </div>
  );
}
