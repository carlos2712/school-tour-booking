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
  enablePinellasCounty: boolean;
  enableHillsboroughCounty: boolean;
  enableManateeCounty: boolean;
  enableIndependentPrivate: boolean;
  enablePwyw: boolean;
  amStartTime: string;
  amEndTime: string;
  pmStartTime: string;
  pmEndTime: string;
  maxStudents: number;
  doubleBookingDiscountPercent: number;
}

interface Performance {
  selectedDateStr: string;  // "yyyy-MM-dd" — the calendar selection
  showDateId: string;       // the actual slot id (set after AM/PM pick)
  venueLocation: string;
  studentCount: string;
  preferredAlternateDate?: string;
  customTime?: string;
  pmCustomTime?: string;
}

const contactSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(1, "Address is required"),
  grades: z.string().min(1, "Grade(s) is required"),
});
type ContactFormData = z.infer<typeof contactSchema>;

export interface InitialBookingData {
  id: string;
  contact: ContactFormData;
  performanceCount: 1 | 2;
  sameDay: boolean;
  performances: Performance[];
  paymentOption: "PINELLAS_COUNTY" | "HILLSBOROUGH_COUNTY" | "MANATEE_COUNTY" | "INDEPENDENT_PRIVATE" | "PAY_WHAT_YOU_CAN";
  paymentAmount: string;
  notes: string;
  customAnswers: Record<string, string | string[]>;
}

interface Props {
  show: ShowInfo;
  availableDates: ShowDate[];
  customQuestions: CustomQuestion[];
  isModification?: boolean;
  initialData?: InitialBookingData;
}

const STEPS = ["Contact Info", "Performance Details", "Payment & Extras", "Review"];

export function BookingFormWrapper({ show, availableDates, customQuestions, isModification, initialData }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState<ContactFormData | null>(initialData?.contact ?? null);
  const [performanceCount, setPerformanceCount] = useState<1 | 2>(initialData?.performanceCount ?? 1);
  const [sameDay, setSameDay] = useState(initialData?.sameDay ?? false);
  const [performances, setPerformances] = useState<Performance[]>(initialData?.performances ?? [{ selectedDateStr: "", showDateId: "", venueLocation: "", studentCount: "" }]);
  const [paymentOption, setPaymentOption] = useState<"PINELLAS_COUNTY" | "HILLSBOROUGH_COUNTY" | "MANATEE_COUNTY" | "INDEPENDENT_PRIVATE" | "PAY_WHAT_YOU_CAN">(initialData?.paymentOption ?? "PINELLAS_COUNTY");
  const [paymentAmount, setPaymentAmount] = useState(initialData?.paymentAmount ?? "");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | string[]>>(initialData?.customAnswers ?? {});
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({ 
    resolver: zodResolver(contactSchema) as any,
    defaultValues: initialData?.contact
  });

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
      const students = updated[perfIndex]?.studentCount ?? "";

      if (sameDay) {
        const amSlot = slots.find(s => s.timeSlot === "AM");
        updated[perfIndex] = {
          selectedDateStr: dateStr,
          showDateId: amSlot ? amSlot.id : "",
          venueLocation: venue,
          studentCount: students,
          customTime: updated[perfIndex]?.customTime || show.amStartTime,
          pmCustomTime: updated[perfIndex]?.pmCustomTime || show.pmStartTime,
        };
      } else {
        const autoSelectedSlot = slots.length === 1 ? slots[0] : null;
        updated[perfIndex] = {
          selectedDateStr: dateStr,
          showDateId: slots.length === 1 ? slots[0].id : "",
          venueLocation: venue,
          studentCount: students,
          customTime: updated[perfIndex]?.customTime || (autoSelectedSlot?.timeSlot === "AM" ? show.amStartTime : ""),
          pmCustomTime: updated[perfIndex]?.pmCustomTime || (autoSelectedSlot?.timeSlot === "PM" ? show.pmStartTime : ""),
        };
      }
      return updated;
    });
  }

  function handleSlotSelect(perfIndex: number, showDateId: string) {
    setPerformances((prev) => {
      const updated = [...prev];
      const slot = availableDates.find((d) => d.id === showDateId);
      if (updated[perfIndex]) {
        updated[perfIndex] = {
          ...updated[perfIndex]!,
          showDateId,
          customTime: slot?.timeSlot === "AM" ? (updated[perfIndex].customTime || show.amStartTime) : updated[perfIndex].customTime,
          pmCustomTime: slot?.timeSlot === "PM" ? (updated[perfIndex].pmCustomTime || show.pmStartTime) : updated[perfIndex].pmCustomTime,
        };
      }
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
        ? [performances[0] ?? { selectedDateStr: "", showDateId: "", venueLocation: "", studentCount: "" }]
        : [performances[0] ?? { selectedDateStr: "", showDateId: "", venueLocation: "", studentCount: "" }, performances[1] ?? { selectedDateStr: "", showDateId: "", venueLocation: "", studentCount: "" }]
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
      const studentCountNum = parseInt(p.studentCount, 10);
      if (isNaN(studentCountNum) || studentCountNum < 1 || studentCountNum > show.maxStudents) return false;

      const slot = sameDay ? getSlotsForDate(p.selectedDateStr).find(s => s.timeSlot === "AM") : availableDates.find((d) => d.id === p.showDateId);
      const pmSlot = sameDay ? getSlotsForDate(p.selectedDateStr).find(s => s.timeSlot === "PM") : undefined;

      if (slot?.timeSlot === "AM" || sameDay) {
        if (!p.customTime || p.customTime.trim().length === 0) return false;
        if (p.customTime < show.amStartTime || p.customTime > show.amEndTime) return false;
      }

      if (sameDay || slot?.timeSlot === "PM") {
        if (!p.pmCustomTime || p.pmCustomTime.trim().length === 0) return false;
        if (p.pmCustomTime < show.pmStartTime || p.pmCustomTime > show.pmEndTime) return false;
      }

      return true;
    });


  async function handleSubmitBooking() {
    setSubmitting(true);
    setError("");

    const secondShowDiscountAmt =
      performanceCount === 2 && show.doubleBookingDiscountPercent > 0
        ? (show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100
        : 0;
    const secondShowPrice = show.fullFeeAmount - secondShowDiscountAmt;
    const doubleBookingTotal =
      performanceCount === 2
        ? show.fullFeeAmount + secondShowPrice
        : show.fullFeeAmount * performanceCount;

    let finalPaymentAmount: number | undefined = undefined;
    if (paymentOption === "PAY_WHAT_YOU_CAN") {
      finalPaymentAmount = Number(paymentAmount);
    } else if (paymentOption === "HILLSBOROUGH_COUNTY" || paymentOption === "MANATEE_COUNTY" || paymentOption === "INDEPENDENT_PRIVATE") {
      finalPaymentAmount = doubleBookingTotal;
    }

    try {
      const url = isModification ? "/api/bookings/modify" : "/api/bookings";
      const method = isModification ? "PUT" : "POST";
      
      const payload = {
        showId: show.id,
        bookingId: isModification ? initialData?.id : undefined,
        ...contact,
        performanceCount,
        paymentOption,
        paymentAmount: finalPaymentAmount,
        notes,
        customAnswers,
        performances: sameDay
          ? [
            {
              showDateId: getSlotsForDate(performances[0]!.selectedDateStr).find(s => s.timeSlot === "AM")?.id ?? "",
              venueLocation: performances[0]!.venueLocation,
              studentCount: parseInt(performances[0]!.studentCount, 10) || 1,
              customTime: performances[0]!.customTime,
            },
            {
              showDateId: getSlotsForDate(performances[0]!.selectedDateStr).find(s => s.timeSlot === "PM")?.id ?? "",
              venueLocation: performances[0]!.venueLocation,
              studentCount: parseInt(performances[0]!.studentCount, 10) || 1,
              customTime: performances[0]!.pmCustomTime,
            }
          ]
          : performances.slice(0, performanceCount).map((p) => {
            const slot = availableDates.find(d => d.id === p!.showDateId);
            return {
              showDateId: p!.showDateId,
              venueLocation: p!.venueLocation,
              studentCount: parseInt(p!.studentCount, 10) || 1,
              preferredAlternateDate: p!.preferredAlternateDate,
              customTime: slot?.timeSlot === "PM" ? p!.pmCustomTime : p!.customTime,
            };
          }),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === step
                ? "bg-gold text-navy"
                : i < step
                  ? "bg-emerald-600 text-foreground"
                  : "bg-gray-100 text-gray-500"
                }`}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:block ${i === step ? "text-gold font-semibold" : "text-gray-500"
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
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="School / Organization Street Address, City, State, Zip"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-red-400 text-xs">{errors.address.message}</p>
              )}
            </div>
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
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${isSelected
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-gray-200 text-gray-600 hover:border-gold/50"
                      }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {performanceCount === 2 && show.doubleBookingDiscountPercent > 0 && (
              <div className="mt-3 text-sm text-gold bg-gold/10 p-3 rounded-md border border-gold/20 space-y-1">
                <p className="font-semibold">
                  A {show.doubleBookingDiscountPercent}% discount will be applied to your 2nd show!
                </p>
                <p className="text-xs text-gray-600">
                  1st Show: <span className="font-medium text-foreground">${show.fullFeeAmount}</span> • 2nd Show: <span className="font-medium text-foreground">${show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100)}</span> (Saved ${(show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100}) • <span className="font-bold text-gold">Total: ${show.fullFeeAmount + (show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100))}</span>
                </p>
              </div>
            )}
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
                          className={`px-8 py-3 rounded-md border font-semibold transition-colors ${selectedSlot?.id === slot.id
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
                      type="time"
                      min={show.amStartTime}
                      max={show.amEndTime}
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
                    <p className="text-xs text-gray-500 mt-1">Available between {show.amStartTime} and {show.amEndTime}</p>
                    {performances[perfIndex]?.customTime && (performances[perfIndex]!.customTime! < show.amStartTime || performances[perfIndex]!.customTime! > show.amEndTime) && (
                      <p className="text-xs text-red-500 mt-1">Time must be between {show.amStartTime} and {show.amEndTime}</p>
                    )}
                  </div>
                )}

                {(sameDay || selectedSlot?.timeSlot === "PM" || (!sameDay && slots.length === 1 && slots[0].timeSlot === "PM")) && selectedDateStr && (
                  <div className="space-y-1.5 mt-4">
                    <Label>Requested PM Start Time *</Label>
                    <Input
                      type="time"
                      min={show.pmStartTime}
                      max={show.pmEndTime}
                      value={performances[perfIndex]?.pmCustomTime ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPerformances((prev) => {
                          const updated = [...prev];
                          if (updated[perfIndex]) {
                            updated[perfIndex] = { ...updated[perfIndex]!, pmCustomTime: val };
                          }
                          return updated;
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Available between {show.pmStartTime} and {show.pmEndTime}</p>
                    {performances[perfIndex]?.pmCustomTime && (performances[perfIndex]!.pmCustomTime! < show.pmStartTime || performances[perfIndex]!.pmCustomTime! > show.pmEndTime) && (
                      <p className="text-xs text-red-500 mt-1">Time must be between {show.pmStartTime} and {show.pmEndTime}</p>
                    )}
                  </div>
                )}


                <div className="grid sm:grid-cols-2 gap-5 mt-4 items-start">
                  <div className="space-y-1.5">
                    <div className="min-h-[44px] flex flex-col justify-end">
                      <Label>
                        Performance Space / Location *
                        <span className="block text-xs text-gray-500 font-normal mt-0.5">
                          (e.g., School auditorium, cafeteria, classroom)
                        </span>
                      </Label>
                    </div>
                    <Input
                      placeholder="e.g. Suncoast Elementary School"
                      value={performances[perfIndex]?.venueLocation ?? ""}
                      onChange={(e) => handleVenueChange(perfIndex, e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="min-h-[44px] flex flex-col justify-end">
                      <Label>Number of Students *</Label>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={show.maxStudents}
                      placeholder="e.g. 150"
                      value={performances[perfIndex]?.studentCount ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPerformances((prev) => {
                          const updated = [...prev];
                          if (updated[perfIndex]) {
                            updated[perfIndex] = { ...updated[perfIndex]!, studentCount: val };
                          }
                          return updated;
                        });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum allowed: {show.maxStudents} students</p>
                    {performances[perfIndex]?.studentCount && parseInt(performances[perfIndex]!.studentCount, 10) > show.maxStudents && (
                      <p className="text-xs text-red-500 mt-1">Exceeds maximum allowed of {show.maxStudents} students</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep(0)}>
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
              {show.enablePinellasCounty && (
                <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gold/50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="PINELLAS_COUNTY"
                    checked={paymentOption === "PINELLAS_COUNTY"}
                    onChange={() => setPaymentOption("PINELLAS_COUNTY")}
                    className="mt-1 accent-gold"
                  />
                  <div>
                    <p className="font-medium text-foreground">Pinellas County District Schools (PCSB)</p>
                    <p className="text-sm text-gray-500">
                      Fully funded by the District for PCSB schools only.
                    </p>
                  </div>
                </label>
              )}
              {show.enableHillsboroughCounty && (
                <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gold/50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="HILLSBOROUGH_COUNTY"
                    checked={paymentOption === "HILLSBOROUGH_COUNTY"}
                    onChange={() => setPaymentOption("HILLSBOROUGH_COUNTY")}
                    className="mt-1 accent-gold"
                  />
                  <div>
                    {performanceCount === 2 && show.doubleBookingDiscountPercent > 0 ? (
                      <>
                        <p className="font-medium text-foreground">
                          Hillsborough County School (${show.fullFeeAmount + (show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100))})
                        </p>
                        <p className="text-sm text-gray-500">
                          1st Show: ${show.fullFeeAmount} + 2nd Show: ${show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100)} ({show.doubleBookingDiscountPercent}% discount applied to 2nd show).
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">
                          Hillsborough County School (${show.fullFeeAmount * performanceCount})
                        </p>
                        <p className="text-sm text-gray-500">Regular fee.</p>
                      </>
                    )}
                  </div>
                </label>
              )}
              {show.enableManateeCounty && (
                <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gold/50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="MANATEE_COUNTY"
                    checked={paymentOption === "MANATEE_COUNTY"}
                    onChange={() => setPaymentOption("MANATEE_COUNTY")}
                    className="mt-1 accent-gold"
                  />
                  <div>
                    {performanceCount === 2 && show.doubleBookingDiscountPercent > 0 ? (
                      <>
                        <p className="font-medium text-foreground">
                          Manatee County Schools (${show.fullFeeAmount + (show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100))})
                        </p>
                        <p className="text-sm text-gray-500">
                          1st Show: ${show.fullFeeAmount} + 2nd Show: ${show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100)} ({show.doubleBookingDiscountPercent}% discount applied to 2nd show).
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">
                          Manatee County Schools (${show.fullFeeAmount * performanceCount})
                        </p>
                        <p className="text-sm text-gray-500">Regular fee.</p>
                      </>
                    )}
                  </div>
                </label>
              )}
              {show.enableIndependentPrivate && (
                <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gold/50 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="INDEPENDENT_PRIVATE"
                    checked={paymentOption === "INDEPENDENT_PRIVATE"}
                    onChange={() => setPaymentOption("INDEPENDENT_PRIVATE")}
                    className="mt-1 accent-gold"
                  />
                  <div>
                    {performanceCount === 2 && show.doubleBookingDiscountPercent > 0 ? (
                      <>
                        <p className="font-medium text-foreground">
                          Independent, Charter and Private schools (${show.fullFeeAmount + (show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100))})
                        </p>
                        <p className="text-sm text-gray-500">
                          1st Show: ${show.fullFeeAmount} + 2nd Show: ${show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100)} ({show.doubleBookingDiscountPercent}% discount applied to 2nd show).
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">
                          Independent, Charter and Private schools (${show.fullFeeAmount * performanceCount})
                        </p>
                        <p className="text-sm text-gray-500">Regular fee.</p>
                      </>
                    )}
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
                      Subject to eligibility. Contribute any amount that works for your budget.
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
                      className={`px-4 py-2 rounded-md border text-sm ${customAnswers[q.id] === opt
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
                        className={`px-4 py-2 rounded-md border text-sm ${isChecked
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
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>
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
                  <dt className="text-gray-500">Address</dt>
                  <dd>{contact.address}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Grades</dt>
                  <dd>{contact.grades}</dd>
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
                  <p className="text-gray-600">PM Time: {performances[0]?.pmCustomTime}</p>
                  <p className="text-gray-600">Venue: {performances[0]?.venueLocation}</p>
                  <p className="text-gray-600">Students: {performances[0]?.studentCount}</p>
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
                    <p className="text-gray-600">Time: {slot?.timeSlot === "PM" ? p?.pmCustomTime : p?.customTime}</p>
                    <p className="text-gray-600">Venue: {p?.venueLocation}</p>
                    <p className="text-gray-600">Students: {p?.studentCount}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-5">
              <h3 className="font-semibold text-gold mb-3">Payment</h3>
              {paymentOption === "PINELLAS_COUNTY" && (
                <p className="text-sm text-foreground">
                  Pinellas County District Schools (PCSB) — Fully funded by the District for PCSB schools only
                </p>
              )}
              {paymentOption === "PAY_WHAT_YOU_CAN" && (
                <p className="text-sm text-foreground">
                  Pay What You Can{paymentAmount ? ` — $${paymentAmount}` : ""}
                </p>
              )}
              {(paymentOption === "HILLSBOROUGH_COUNTY" || paymentOption === "MANATEE_COUNTY" || paymentOption === "INDEPENDENT_PRIVATE") && (
                <div className="text-sm space-y-2">
                  <p className="font-medium text-foreground">
                    {paymentOption === "HILLSBOROUGH_COUNTY"
                      ? "Hillsborough County School"
                      : paymentOption === "MANATEE_COUNTY"
                        ? "Manatee County Schools"
                        : "Independent and Private schools"}
                  </p>
                  {performanceCount === 2 && show.doubleBookingDiscountPercent > 0 ? (
                    <div className="bg-gray-50 p-3 rounded-md space-y-1 text-xs text-gray-600 border border-gray-200">
                      <div className="flex justify-between">
                        <span>1st Show Price:</span>
                        <span className="font-medium text-foreground">${show.fullFeeAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2nd Show Price ({show.doubleBookingDiscountPercent}% discount):</span>
                        <span className="font-medium text-foreground">${show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100)} <span className="text-emerald-600">(-${(show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100})</span></span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-200 font-semibold text-sm text-gold">
                        <span>Total Price:</span>
                        <span>${show.fullFeeAmount + (show.fullFeeAmount - ((show.fullFeeAmount * show.doubleBookingDiscountPercent) / 100))}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">Total: ${show.fullFeeAmount * performanceCount}</p>
                  )}
                </div>
              )}
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
            <Button variant="outline" size="lg" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button
              onClick={handleSubmitBooking}
              disabled={submitting}
              size="lg"
              className="flex-1"
            >
              {submitting ? "Submitting…" : isModification ? "Save Changes →" : "Confirm Booking →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
