"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  bookingId: string;
  currentStatus: string;
  performances: { showDateId: string; isBooked: boolean }[];
}

export function BookingActions({ bookingId, currentStatus, performances }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function updateStatus(status: string, freeSlots = false) {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/bookings/${bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, freeSlots }),
        });
        if (!res.ok) throw new Error("Failed to update");
        router.refresh();
      } catch {
        setError("Failed to update booking status.");
      }
    });
  }

  return (
    <section className="bg-navy-card border border-navy-light rounded-xl p-6">
      <h2 className="text-gold font-semibold mb-4">Admin Actions</h2>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {currentStatus !== "CONFIRMED" && (
          <Button
            onClick={() => updateStatus("CONFIRMED")}
            disabled={isPending}
            size="sm"
          >
            Mark as Confirmed
          </Button>
        )}
        {currentStatus !== "MODIFIED" && (
          <Button
            onClick={() => updateStatus("MODIFIED")}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            Mark as Modified
          </Button>
        )}
        {currentStatus !== "CANCELLED" && (
          <Button
            onClick={() => {
              if (confirm("Cancel this booking and free up the date slots?")) {
                updateStatus("CANCELLED", true);
              }
            }}
            disabled={isPending}
            variant="destructive"
            size="sm"
          >
            Cancel Booking & Free Slots
          </Button>
        )}
        {currentStatus === "CANCELLED" && (
          <Button
            onClick={() => updateStatus("CANCELLED", false)}
            disabled={isPending}
            variant="destructive"
            size="sm"
          >
            Keep Cancelled (slots already freed)
          </Button>
        )}
      </div>
    </section>
  );
}
