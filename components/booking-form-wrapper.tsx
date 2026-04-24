"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DayPicker } from "react-day-picker";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import "react-day-picker/dist/style.css";

type TimeSlot = "AM" | "PM";
type QuestionType = "TEXT" | "RADIO" | "CHECKBOX" | "SELECT";

interface ShowDate {
  id: string;
  date: string;
  timeSlot: TimeSlot;
  isBooked: boolean;
}

interface CustomQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  isRequired: boolean;
}

interface ShowInfo {
  id: string;
  title: string;
  fullFeeAmount: number;
  enableFree: boolean;
  enablePwyw: boolean;
  enableFullFee: boolean;
}

interface Performance {
  selectedDateStr: string;  // "yyyy-MM-dd" — the calendar selection
  showDateId: string;       // the actual slot id (set after AM/PM pick)
  venueLocation: string;
  preferredAlternateDate?: string;
  customTime?: string;
}

const contactSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  grades: z.string().min(1, "Grade(s) is required"),
  studentCount: z.coerce
    .number()
    .min(1, "At least 1 student")
    .max(200, "Maximum 200 students"),
});
type ContactFormData = z.infer<typeof contactSchema>;

interface Props {
  show: ShowInfo;
  availableDates: ShowDate[];
  customQuestions: CustomQuestion[];
}

const STEPS = ["Contact Info", "Performance Details", "Payment & Extras", "Review"];

export function BookingFormWrapper({ show, availableDates, customQuestions }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState<ContactFormData | null>(null);
  const [performanceCount, setPerformanceCount] = useState<1 | 2>(1);
  const [sameDay, setSameDay] = useState(false);
  const [performances, setPerformances] = useState<(Performance | null)[]>([null]);
  const [paymentOption, setPaymentOption] = useState<"FREE" | "PAY_WHAT_YOU_CAN" | "FULL_FEE">("FREE");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | string[]>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) as any });

  // Dates that have at least one open slot
  const openSlotDates = availableDates
    .filter((d) => !d.isBooked)
    .map((d) => parseISO(d.date.slice(0, 10)));

  // Default calendar month = first available date, or today
  const defaultMonth = openSlotDates.length > 0 ? openSlotDates[0] : new Date();

  function getSlotsForDate(dateStr: string): ShowDate[] {
    return availableDates.filter(
      (d) => d.date.slice(0, 10) === dateStr && !d.isBooked
    );
  }

    function handleDateSelect(perfIndex: number, day: Date | undefined) {
    if (!day) return;
    const dateStr = format(day, "yyyy-MM-dd");
    const slots = getSlotsForDate(dateStr);

    setPerformances((prev) => {
      const updated = [...prev];
      const venue = updated[perfIndex]?.venueLocation ?? "";
      
      if (sameDay) {
        const amSlot = slots.find(s => s.timeSlot === "AM");
        updated[perfIndex] = {
          selectedDateStr: dateStr,
          showDateId: amSlot ? amSlot.id : "",
          venueLocation: venue,
          customTime: updated[perfIndex]?.customTime,
        };
      } else {
        updated[perfIndex] = {
          selectedDateStr: dateStr,
          showDateId: slots.length === 1 ? slots[0].id : "",
          venueLocation: venue,
          customTime: updated[perfIndex]?.customTime,
        };
      }
      return updated;
    });
  }

  function handleSlotSelect(perfIndex: number, showDateId: string) {
    setPerformances((prev) => {
      const updated = [...prev];
      updated[perfIndex] = { ...updated[perfIndex]!, showDateId };
      return updated;
    });
  }

  function handleVenueChange(perfIndex: number, value: string) {
    setPerformances((prev) => {
      const updated = [...prev];
      if (updated[perfIndex]) {
        updated[perfIndex] = { ...updated[perfIndex]!, venueLocation: value };
      }
      return updated;
    });
  }

  function handlePerformanceCountChange(count: 1 | 2) {
    setPerformanceCount(count);
    setPerformances(
      count === 1
        ? [performances[0] ?? null]
        : [performances[0] ?? null, performances[1] ?? null]
    );
  }

  function getSelectedDateObj(perfIndex: number): Date | undefined {
    const dateStr = performances[perfIndex]?.selectedDateStr;
    return dateStr ? parseISO(dateStr) : undefined;
  }

  function getSelectedSlot(perfIndex: number): ShowDate | undefined {
    const id = performances[perfIndex]?.showDateId;
    return id ? availableDates.find((d) => d.id === id) : undefined;
  }

  
  const performancesValid = performances
    .slice(0, sameDay ? 1 : performanceCount)
    .every((p) => {
       if (!p) return false;
       if (!p.selectedDateStr) return false;
       if (!sameDay && !p.showDateId) return false;
       if (p.venueLocation.trim().length === 0) return false;
       
       const slot = sameDay ? getSlotsForDate(p.selectedDateStr).find(s => s.timeSlot === "AM") : availableDates.find((d) => d.id === p.showDateId);
       if (slot?.timeSlot === "AM" || sameDay) {
         if (!p.customTime || p.customTime.trim().length === 0) return false;
       }
       return true;
    });


  async function handleSubmitBooking() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId: show.id,
          ...contact,
          performanceCount,
          paymentOption,
          paymentAmount:
            paymentOption === "PAY_WHAT_YOU_CAN" ? Number(paymentAmount) : undefined,
          notes,
          customAnswers,
                    performances: sameDay
            ? [
                {
                  showDateId: getSlotsForDate(performances[0]!.selectedDateStr).find(s => s.timeSlot === "AM")?.id ?? "",
                  venueLocation: performances[0]!.venueLocation,
                  customTime: performances[0]!.customTime,
                },
                {
                  showDateId: getSlotsForDate(performances[0]!.selectedDateStr).find(s => s.timeSlot === "PM")?.id ?? "",
                  venueLocation: performances[0]!.venueLocation,
                }
              ]
            : performances.slice(0, performanceCount).map((p) => ({
                showDateId: p!.showDateId,
                venueLocation: p!.venueLocation,
                preferredAlternateDate: p!.preferredAlternateDate,
                customTime: p!.customTime,
              })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Booking failed");
      }
      const data = await res.json();
      router.push(`/book/confirm?id=${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                i === step
                  ? "bg-gold text-navy"
                  : i < step
                  ? "bg-emerald-600 text-foreground"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:block ${
                i === step ? "text-gold font-semibold" : "text-gray-500"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-100 mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 0: Contact Info */}
      {step === 0 && (
        <form
          onSubmit={handleSubmit((data: ContactFormData) => {
            setContact(data);
            setStep(1);
          })}
          className="space-y-5"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="schoolName">School Name *</Label>
              <Input id="schoolName" {...register("schoolName")} />
              {errors.schoolName && (
                <p className="text-red-400 text-xs">{errors.schoolName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input id="contactName" {...register("contactName")} />
              {errors.contactName && (
                <p className="text-red-400 text-xs">{errors.contactName.message}</p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" type="tel" {...register("phone")} />
              {errors.phone && (
                <p className="text-red-400 text-xs">{errors.phone.message}</p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="grades">Grade(s) *</Label>
              <Input
                id="grades"
                placeholder="e.g. 3rd, 4th, 5th"
                {...register("grades")}
              />
              {errors.grades && (
                <p className="text-red-400 text-xs">{errors.grades.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="studentCount">Number of Students * (max 200)</Label>
              <Input
                id="studentCount"
                type="number"
                min={1}
                max={200}
                {...register("studentCount")}
              />
              {errors.studentCount && (
                <p className="text-red-400 text-xs">{errors.studentCount.message}</p>
              )}
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full mt-2">
            Continue →
          </Button>
        </form>
      )}

      {/* Step 1: Performance Details */}
      {step === 1 && (
        <div className="space-y-8">
          {/* No dates available at all */}
          {openSlotDates.length === 0 && (
            <div className="p-5 border border-amber-700 bg-amber-900/20 rounded-lg text-amber-700 text-sm">
              No performance dates are currently available. Please contact us at{" "}
              <a href="mailto:parbisi@americanstage.org" className="underline">
                parbisi@americanstage.org
              </a>{" "}
              to arrange a booking.
            </div>
          )}

          <div>
            <Label className="text-base font-semibold mb-3 block">
              Number of Performances *
            </Label>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  "1 Performance",
                  "2 Performances – Same Day",
                  "2 Performances – Different Days",
                ] as const
              ).map((label, i) => {
                const count = i === 0 ? 1 : 2;
                const same = i === 1;
                const isSelected =
                  performanceCount === count && (count === 1 || sameDay === same);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      handlePerformanceCountChange(count as 1 | 2);
                      if (count === 2) setSameDay(same);
                    }}
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-gray-200 text-gray-600 hover:border-gold/50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {Array.from({ length: sameDay ? 1 : performanceCount }).map((_, perfIndex) => {
            const selectedDateObj = getSelectedDateObj(perfIndex);
            const selectedDateStr = performances[perfIndex]?.selectedDateStr;
            const slots = selectedDateStr ? getSlotsForDate(selectedDateStr) : [];
            const selectedSlot = getSelectedSlot(perfIndex);

            return (
              <div
                key={perfIndex}
                className="border border-gray-200 rounded-lg p-5 space-y-5"
              >
                <h3 className="font-semibold text-foreground">
                  {performanceCount === 2
                    ? `Performance ${perfIndex + 1}`
                    : "Select Date & Time"}
                </h3>

                <div>
                  <Label className="mb-2 block">
                    Pick a Date *{" "}
                    <span className="text-gray-500 font-normal text-xs">
                      (gold = available)
                    </span>
                  </Label>
                  <div className="bg-gray-50 rounded-lg p-4 inline-block">
                    <DayPicker
                      mode="single"
                      selected={selectedDateObj}
                      defaultMonth={defaultMonth}
                      onSelect={(day) => handleDateSelect(perfIndex, day)}
                      // Disable past dates AND dates with no open slots
                      disabled={[
                        { before: new Date() },
                        (day: Date) =>
                          getSlotsForDate(format(day, "yyyy-MM-dd")).length < (sameDay ? 2 : 1),
                      ]}
                      // Highlight open-slot dates in gold
                      modifiers={{ available: openSlotDates }}
                      modifiersStyles={{
                        available: {
                          backgroundColor: "rgba(201,168,76,0.18)",
                          color: "#c9a84c",
                          fontWeight: "bold",
                          borderRadius: "6px",
                        },
                      }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded inline-block"
                        style={{ backgroundColor: "rgba(201,168,76,0.4)" }}
                      />
                      Available
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-gray-600 inline-block" />
                      Unavailable
                    </span>
                  </div>
                </div>

                {/* Time slot picker — shows as soon as a date is selected */}
                {!sameDay && selectedDateStr && slots.length > 1 && (
                  <div>
                    <Label className="mb-2 block">Select Time *</Label>
                    <div className="flex gap-3">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleSlotSelect(perfIndex, slot.id)}
                          className={`px-8 py-3 rounded-md border font-semibold transition-colors ${
                            selectedSlot?.id === slot.id
                              ? "border-gold bg-gold/10 text-gold"
                              : "border-gray-200 text-gray-600 hover:border-gold/50"
                          }`}
                        >
                          {slot.timeSlot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!sameDay && selectedDateStr && slots.length === 1 && (
                  <p className="text-sm text-gray-600">
                    Time slot:{" "}
                    <span className="text-gold font-semibold">
                      {slots[0].timeSlot}
                    </span>{" "}
                    (auto-selected)
                  </p>
                )}

                
                {(sameDay || selectedSlot?.timeSlot === "AM" || (!sameDay && slots.length === 1 && slots[0].timeSlot === "AM")) && selectedDateStr && (
                  <div className="space-y-1.5 mt-4">
                    <Label>Requested AM Start Time *</Label>
                    <Input
                      placeholder="e.g. 9:30 AM"
                      value={performances[perfIndex]?.customTime ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPerformances((prev) => {
                          const updated = [...prev];
                          if (updated[perfIndex]) {
                            updated[perfIndex] = { ...updated[perfIndex]!, customTime: val };
                          }
                          return updated;
                        });
                      }}
                    />
                  </div>
                )}


                {selectedDateStr && slots.length === 0 && (
                  <p className="text-sm text-amber-400">
                    No open slots for this date. Please pick another.
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label>School / Venue Location *</Label>
                  <Input
                    placeholder="e.g. Suncoast Elementary School"
                    value={performances[perfIndex]?.venueLocation ?? ""}
                    onChange={(e) => handleVenueChange(perfIndex, e.target.value)}
                  />
                </div>
              </div>
            );
          })}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>
              ← Back
            </Button>
            <Button
              onClick={() => setStep(2)}
              disabled={!performancesValid}
              size="lg"
              className="flex-1"
            >
              Continue →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Payment & Extras */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Payment Option *
            </Label>
            <div className="space-y-3">
              {show.enableFree && (
                <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gold/50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="FREE"
                    checked={paymentOption === "FREE"}
                    onChange={() => setPaymentOption("FREE")}
                    className="mt-1 accent-gold"
                  />
                  <div>
                    <p className="font-medium text-foreground">Free Performance</p>
                    <p className="text-sm text-gray-500">
                      Fully funded — no cost to your school. Subject to eligibility.
                    </p>
                  </div>
                </label>
              )}
              {show.enablePwyw && (
                <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gold/50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="PAY_WHAT_YOU_CAN"
                    checked={paymentOption === "PAY_WHAT_YOU_CAN"}
                    onChange={() => setPaymentOption("PAY_WHAT_YOU_CAN")}
                    className="mt-1 accent-gold"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Pay What You Can</p>
                    <p className="text-sm text-gray-500 mb-2">
                      Contribute any amount that works for your budget.
                    </p>
                    {paymentOption === "PAY_WHAT_YOU_CAN" && (
                      <Input
                        type="number"
                        placeholder="Enter amount ($)"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="max-w-xs"
                      />
                    )}
                  </div>
                </label>
              )}
              {show.enableFullFee && (
                <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gold/50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="FULL_FEE"
                    checked={paymentOption === "FULL_FEE"}
                    onChange={() => setPaymentOption("FULL_FEE")}
                    className="mt-1 accent-gold"
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      Full Fee (${show.fullFeeAmount})
                    </p>
                    <p className="text-sm text-gray-500">Standard rate per performance.</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {customQuestions.map((q) => (
            <div key={q.id} className="space-y-1.5">
              <Label>
                {q.text} {q.isRequired && "*"}
              </Label>
              {q.type === "TEXT" && (
                <Textarea
                  value={(customAnswers[q.id] as string) ?? ""}
                  onChange={(e) =>
                    setCustomAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                />
              )}
              {(q.type === "RADIO" || q.type === "SELECT") && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setCustomAnswers((prev) => ({ ...prev, [q.id]: opt }))
                      }
                      className={`px-4 py-2 rounded-md border text-sm ${
                        customAnswers[q.id] === opt
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {q.type === "CHECKBOX" && (
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected =
                      (customAnswers[q.id] as string[] | undefined) ?? [];
                    const isChecked = selected.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setCustomAnswers((prev) => {
                            const cur =
                              (prev[q.id] as string[] | undefined) ?? [];
                            return {
                              ...prev,
                              [q.id]: isChecked
                                ? cur.filter((x) => x !== opt)
                                : [...cur, opt],
                            };
                          });
                        }}
                        className={`px-4 py-2 rounded-md border text-sm ${
                          isChecked
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="space-y-1.5">
            <Label>Questions / Comments / Requests</Label>
            <Textarea
              placeholder="Any special accommodations, questions, or requests?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button onClick={() => setStep(3)} size="lg" className="flex-1">
              Review Booking →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && contact && (
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg divide-y divide-navy-light">
            <div className="p-5">
              <h3 className="font-semibold text-gold mb-3">Contact Information</h3>
              <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-gray-500">School</dt>
                  <dd>{contact.schoolName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Contact</dt>
                  <dd>{contact.contactName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd>{contact.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd>{contact.phone}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Grades</dt>
                  <dd>{contact.grades}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Students</dt>
                  <dd>{contact.studentCount}</dd>
                </div>
              </dl>
            </div>

            <div className="p-5">
              <h3 className="font-semibold text-gold mb-3">Performances</h3>
                            {sameDay ? (
                <div className="mb-3 text-sm">
                  <p className="font-medium text-foreground">Both AM & PM Performances</p>
                  {performances[0]?.selectedDateStr && (
                    <p className="text-gray-600">
                      {format(parseISO(performances[0].selectedDateStr), "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                  <p className="text-gray-600">AM Time: {performances[0]?.customTime}</p>
                  <p className="text-gray-600">Venue: {performances[0]?.venueLocation}</p>
                </div>
              ) : performances.slice(0, performanceCount).map((p, i) => {
                const slot = availableDates.find((d) => d.id === p?.showDateId);
                return (
                  <div key={i} className="mb-3 text-sm">
                    <p className="font-medium text-foreground">Performance {i + 1}</p>
                    {slot && (
                      <p className="text-gray-600">
                        {format(parseISO(slot.date.slice(0, 10)), "EEEE, MMMM d, yyyy")} —{" "}
                        <span className="text-gold">{slot.timeSlot}</span>
                      </p>
                    )}
                    <p className="text-gray-600">Venue: {p?.venueLocation}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-5">
              <h3 className="font-semibold text-gold mb-3">Payment</h3>
              <p className="text-sm">
                {paymentOption === "FREE" && "Free Performance"}
                {paymentOption === "PAY_WHAT_YOU_CAN" &&
                  `Pay What You Can${paymentAmount ? ` — $${paymentAmount}` : ""}`}
                {paymentOption === "FULL_FEE" && `Full Fee — $${show.fullFeeAmount}`}
              </p>
            </div>

            {notes && (
              <div className="p-5">
                <h3 className="font-semibold text-gold mb-3">Notes</h3>
                <p className="text-sm text-gray-600">{notes}</p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm p-3 bg-red-900/20 rounded-md border border-red-800">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button
              onClick={handleSubmitBooking}
              disabled={submitting}
              size="lg"
              className="flex-1"
            >
              {submitting ? "Submitting…" : "Confirm Booking →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
