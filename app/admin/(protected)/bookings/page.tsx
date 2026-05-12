import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: {
      show: { select: { title: true } },
      performances: {
        include: { showDate: true },
        orderBy: { showDate: { date: "asc" } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-1">Bookings</h1>
      <p className="text-gray-500 text-sm mb-8">
        {bookings.length} total booking{bookings.length !== 1 ? "s" : ""}
      </p>

      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const firstPerf = booking.performances[0];
            return (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="block bg-gray-50 border border-gray-200 rounded-lg p-5 hover:border-gold/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-foreground font-semibold truncate">
                        {booking.schoolName}
                      </p>
                      <Badge
                        variant={
                          booking.status === "CONFIRMED"
                            ? "confirmed"
                            : booking.status === "CANCELLED"
                            ? "cancelled"
                            : "modified"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {booking.contactName} · {booking.email}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {booking.show.title} · {booking.performances.reduce((acc, p) => acc + p.studentCount, 0)} students ·{" "}
                      {booking.performanceCount} performance
                      {booking.performanceCount > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {firstPerf && (
                      <p className="text-foreground text-sm">
                        {format(new Date(firstPerf.showDate.date), "MMM d, yyyy")}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-0.5">
                      Booked {format(new Date(booking.createdAt), "MMM d")}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
