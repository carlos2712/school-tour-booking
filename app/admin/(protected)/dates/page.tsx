import { prisma } from "@/lib/prisma";
import { DateManager } from "./date-manager";

export const dynamic = "force-dynamic";

export default async function AdminDatesPage() {
  const show = await prisma.show.findFirst({
    where: { isActive: true },
    include: {
      dates: { orderBy: [{ date: "asc" }, { timeSlot: "asc" }] },
    },
  });

  if (!show) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Manage Dates</h1>
        <p className="text-gray-400">
          No active show. Please create a show first in{" "}
          <a href="/admin/show" className="text-gold hover:underline">
            Show Setup
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Manage Dates</h1>
      <p className="text-gray-400 text-sm mb-8">
        Add AM/PM time slots for <span className="text-white">{show.title}</span>.
        Click a date to add or remove slots.
      </p>
      <DateManager
        showId={show.id}
        existingDates={show.dates.map((d) => ({
          id: d.id,
          date: d.date.toISOString(),
          timeSlot: d.timeSlot,
          isAvailable: d.isAvailable,
          isBooked: d.isBooked,
        }))}
      />
    </div>
  );
}
