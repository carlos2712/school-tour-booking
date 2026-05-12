"use client";

import { useState, useTransition } from "react";
import { DayPicker } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import "react-day-picker/dist/style.css";

type TimeSlot = "AM" | "PM";

interface ShowDate {
  id: string;
  date: string;
  timeSlot: TimeSlot;
  isAvailable: boolean;
  isBooked: boolean;
}

interface Props {
  showId: string;
  existingDates: ShowDate[];
}

export function DateManager({ showId, existingDates }: Props) {
  const [dates, setDates] = useState<ShowDate[]>(existingDates);
  const [selectedDays, setSelectedDays] = useState<Date[] | undefined>();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const dateMap = new Map<string, ShowDate[]>();
  for (const d of dates) {
    const key = d.date.slice(0, 10);
    if (!dateMap.has(key)) dateMap.set(key, []);
    dateMap.get(key)!.push(d);
  }

  function getDayStatus(day: Date): "available" | "booked" | "partial" | "none" {
    const key = format(day, "yyyy-MM-dd");
    const slots = dateMap.get(key);
    if (!slots || slots.length === 0) return "none";
    const booked = slots.filter((s) => s.isBooked).length;
    if (booked === slots.length) return "booked";
    if (booked > 0) return "partial";
    return "available";
  }

  async function addSlot(timeSlot: TimeSlot) {
    if (!selectedDays || selectedDays.length === 0) return;
    setError("");
    startTransition(async () => {
      try {
        const newDates: ShowDate[] = [];
        for (const day of selectedDays) {
          const res = await fetch("/api/admin/dates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              showId,
              date: format(day, "yyyy-MM-dd"),
              timeSlot,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error ?? "Failed to add slot");
          }
          const data = await res.json();
          newDates.push(data);
        }
        setDates((prev) => [...prev, ...newDates]);
        setSelectedDays(undefined); // Clear selection after adding
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add slot");
      }
    });
  }

  async function toggleAvailability(id: string, isAvailable: boolean) {
    startTransition(async () => {
      await fetch(`/api/admin/dates?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });
      setDates((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isAvailable } : d))
      );
    });
  }

  async function deleteSlot(id: string) {
    startTransition(async () => {
      await fetch(`/api/admin/dates?id=${id}`, { method: "DELETE" });
      setDates((prev) => prev.filter((d) => d.id !== id));
    });
  }

  // Provide a merged view for all selected dates (used to show added slots on selection)
  const selectedSlots = selectedDays
    ? selectedDays.flatMap(day => dateMap.get(format(day, "yyyy-MM-dd")) ?? [])
    : [];
  const hasAM = selectedDays && selectedDays.length > 0 && selectedDays.every(day => {
    const slots = dateMap.get(format(day, "yyyy-MM-dd")) ?? [];
    return slots.some((s) => s.timeSlot === "AM");
  });
  const hasPM = selectedDays && selectedDays.length > 0 && selectedDays.every(day => {
    const slots = dateMap.get(format(day, "yyyy-MM-dd")) ?? [];
    return slots.some((s) => s.timeSlot === "PM");
  });

  const allDates = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, slots]) => ({ dateStr, slots }));

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Calendar */}
      <div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h2 className="text-foreground font-semibold mb-4">Select a Date</h2>
          <DayPicker
            mode="multiple"
            selected={selectedDays}
            onSelect={setSelectedDays}
            fromDate={new Date()}
            modifiers={{
              available: Array.from(dateMap.entries())
                .filter(([, slots]) => slots.some((s) => !s.isBooked && s.isAvailable))
                .map(([dateStr]) => parseISO(dateStr)),
              booked: Array.from(dateMap.entries())
                .filter(([, slots]) => slots.every((s) => s.isBooked))
                .map(([dateStr]) => parseISO(dateStr)),
            }}
            modifiersStyles={{
              available: { fontWeight: "bold" },
            }}
          />

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
              Booked
            </span>
          </div>
        </div>

        {/* Add slots panel */}
        {selectedDays && selectedDays.length > 0 && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="text-foreground font-semibold">
              {selectedDays.length === 1
                ? format(selectedDays[0], "EEEE, MMMM d, yyyy")
                : `${selectedDays.length} Days Selected`}
            </h3>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3">
              <Button
                onClick={() => addSlot("AM")}
                disabled={isPending || hasAM}
                variant={hasAM ? "secondary" : "default"}
                size="sm"
              >
                {hasAM ? "AM Added ✓" : "+ Add AM Slot"}
              </Button>
              <Button
                onClick={() => addSlot("PM")}
                disabled={isPending || hasPM}
                variant={hasPM ? "secondary" : "default"}
                size="sm"
              >
                {hasPM ? "PM Added ✓" : "+ Add PM Slot"}
              </Button>
            </div>

            {selectedSlots.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Slots on selected dates:</p>
                {selectedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-md"
                  >
                    <span className="text-xs font-semibold text-gray-500 w-24">
                      {format(parseISO(slot.date.slice(0,10)), "MMM d, yyyy")}
                    </span>
                    <Badge
                      variant={
                        slot.isBooked
                          ? "booked"
                          : slot.isAvailable
                          ? "available"
                          : "unavailable"
                      }
                    >
                      {slot.timeSlot}
                    </Badge>
                    <span className="text-sm text-gray-600 flex-1">
                      {slot.isBooked
                        ? "Booked"
                        : slot.isAvailable
                        ? "Available"
                        : "Unavailable"}
                    </span>
                    {!slot.isBooked && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleAvailability(slot.id, !slot.isAvailable)
                        }
                        className="text-xs text-gold hover:underline"
                      >
                        {slot.isAvailable ? "Disable" : "Enable"}
                      </button>
                    )}
                    {!slot.isBooked && (
                      <button
                        type="button"
                        onClick={() => deleteSlot(slot.id)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* All dates list */}
      <div>
        <h2 className="text-foreground font-semibold mb-4">All Configured Dates</h2>
        {allDates.length === 0 ? (
          <p className="text-gray-500 text-sm">No dates configured yet. Click a date on the calendar to add slots.</p>
        ) : (
          <div className="space-y-2">
            {allDates.map(({ dateStr, slots }) => (
              <div
                key={dateStr}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
              >
                <p className="text-foreground text-sm font-medium mb-2">
                  {format(parseISO(dateStr), "EEEE, MMMM d, yyyy")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {slots.map((slot) => (
                    <Badge
                      key={slot.id}
                      variant={
                        slot.isBooked
                          ? "booked"
                          : slot.isAvailable
                          ? "available"
                          : "unavailable"
                      }
                    >
                      {slot.timeSlot} — {slot.isBooked ? "Booked" : slot.isAvailable ? "Open" : "Closed"}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
