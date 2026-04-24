import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [show, totalBookings, confirmedBookings] = await Promise.all([
    prisma.show.findFirst({ where: { isActive: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
  ]);

  const upcomingDates = show
    ? await prisma.showDate.count({
        where: {
          showId: show.id,
          isAvailable: true,
          isBooked: false,
          date: { gte: new Date() },
        },
      })
    : 0;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">Welcome to the School Tours admin panel.</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <StatCard label="Total Bookings" value={totalBookings} />
        <StatCard label="Confirmed Bookings" value={confirmedBookings} />
        <StatCard label="Available Dates" value={upcomingDates} />
      </div>

      {/* Active show */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-3">Active Show</h2>
        {show ? (
          <div className="bg-navy-card border border-navy-light rounded-lg p-5 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{show.title}</p>
              <p className="text-gray-400 text-sm mt-0.5">
                {show.description.slice(0, 100)}
                {show.description.length > 100 ? "…" : ""}
              </p>
            </div>
            <Link
              href="/admin/show"
              className="text-sm text-gold hover:underline ml-4 whitespace-nowrap"
            >
              Edit →
            </Link>
          </div>
        ) : (
          <div className="bg-navy-card border border-navy-light rounded-lg p-5">
            <p className="text-gray-400 text-sm">No active show.</p>
            <Link href="/admin/show" className="text-gold text-sm hover:underline mt-1 inline-block">
              Create a show →
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <QuickLink href="/admin/show" label="Edit Show Details" desc="Update title, description, images, pricing" />
          <QuickLink href="/admin/dates" label="Manage Dates" desc="Add or remove available performance slots" />
          <QuickLink href="/admin/bookings" label="View Bookings" desc="See all school bookings and their status" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-navy-card border border-navy-light rounded-lg p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="bg-navy-card border border-navy-light rounded-lg p-5 hover:border-gold/50 transition-colors block"
    >
      <p className="text-white font-medium mb-1">{label}</p>
      <p className="text-gray-400 text-sm">{desc}</p>
    </Link>
  );
}
