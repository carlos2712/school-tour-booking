"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Props {
  bookingId: string;
  schoolName: string;
  currentStatus: string;
  performances: { showDateId: string; isBooked: boolean }[];
}

export function BookingActions({ bookingId, schoolName, currentStatus, performances }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function updateStatus(status: string, freeSlots = false) {
    setError("");
    setEmailStatus(null);
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

  async function resendConfirmationEmail() {
    setError("");
    setEmailStatus(null);
    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/resend-email`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend email.");
      setEmailStatus("Confirmation email successfully re-sent to contact!");
    } catch (err: any) {
      setError(err.message || "Failed to resend confirmation email.");
    } finally {
      setIsSendingEmail(false);
    }
  }

  async function handleDeleteBooking() {
    setError("");
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete booking.");
      }
      setIsDeleteModalOpen(false);
      router.push("/admin/bookings");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete booking.");
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }

  return (
    <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
      <h2 className="text-gold font-semibold mb-4">Admin Actions</h2>

      {error && <p className="text-red-500 text-sm mb-3 font-medium">{error}</p>}
      {emailStatus && <p className="text-green-600 text-sm mb-3 font-medium">{emailStatus}</p>}

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={resendConfirmationEmail}
          disabled={isSendingEmail || isPending || isDeleting}
          variant="outline"
          size="sm"
        >
          {isSendingEmail ? "Sending..." : "Resend Confirmation Email"}
        </Button>

        {currentStatus !== "CONFIRMED" && (
          <Button
            onClick={() => updateStatus("CONFIRMED")}
            disabled={isPending || isSendingEmail || isDeleting}
            size="sm"
          >
            Mark as Confirmed
          </Button>
        )}
        {currentStatus !== "MODIFIED" && (
          <Button
            onClick={() => updateStatus("MODIFIED")}
            disabled={isPending || isSendingEmail || isDeleting}
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
            disabled={isPending || isSendingEmail || isDeleting}
            variant="outline"
            size="sm"
          >
            Cancel Booking & Free Slots
          </Button>
        )}

        <Button
          onClick={() => setIsDeleteModalOpen(true)}
          disabled={isPending || isSendingEmail || isDeleting}
          variant="destructive"
          size="sm"
        >
          Delete Booking
        </Button>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteBooking}
        title="Delete Booking"
        confirmText="Delete Booking"
        isLoading={isDeleting}
        variant="destructive"
        description={
          <>
            <p>
              Are you sure you want to delete the booking for{" "}
              <strong className="text-foreground">{schoolName}</strong>?
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This action will soft-delete the booking from the admin panel and automatically free up any reserved date slots.
              Restoration can only be done directly via the database.
            </p>
          </>
        }
      />
    </section>
  );
}
