import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { format } from "date-fns";
import Link from "next/link";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Booking not found.</p>
        </main>
      </div>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      show: true,
      performances: { include: { showDate: true } },
    },
  });

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Booking not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-6">🎭</div>
        <h1 className="text-3xl font-bold text-white mb-3">
          You&apos;re all booked!
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          A confirmation email has been sent to{" "}
          <span className="text-gold">{booking.email}</span>.
        </p>

        <div className="bg-navy-card border border-navy-light rounded-xl p-8 text-left space-y-5 mb-10">
          <div>
            <p className="text-gray-400 text-sm">Show</p>
            <p className="text-white font-semibold text-lg">{booking.show.title}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-2">Performance(s)</p>
            {booking.performances.map((perf: any, i: number) => (
              <div key={i} className="mb-2">
                <p className="text-white">
                  {format(new Date(perf.showDate.date), "EEEE, MMMM d, yyyy")} —{" "}
                  <span className="text-gold font-semibold">
                    {perf.showDate.timeSlot}
                  </span>
                </p>
                <p className="text-gray-400 text-sm">{perf.venueLocation}</p>
                <p className="text-gray-400 text-sm">Students: {perf.studentCount}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">School</p>
              <p className="text-white">{booking.schoolName}</p>
            </div>
            <div>
              <p className="text-gray-400">Contact</p>
              <p className="text-white">{booking.contactName}</p>
            </div>
            <div>
              <p className="text-gray-400">Booking ID</p>
              <p className="text-white font-mono text-xs">{booking.id}</p>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Questions? Contact us at{" "}
          <a href="mailto:parbisi@americanstage.org" className="text-gold hover:underline">
            parbisi@americanstage.org
          </a>{" "}
          or{" "}
          <a href="tel:7276854014" className="text-gold hover:underline">
            (727) 685-4014
          </a>
          .
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 border border-gold text-gold rounded-md hover:bg-gold/10 transition-colors text-sm"
        >
          ← Back to School Tour
        </Link>
      </main>
    </div>
  );
}
