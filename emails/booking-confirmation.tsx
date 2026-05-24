import * as React from "react";

interface Performance {
  date: string;
  timeSlot: string;
  venueLocation: string;
  studentCount: number;
  customTime?: string;
}

interface BookingConfirmationEmailProps {
  contactName: string;
  schoolName: string;
  showTitle: string;
  performances: Performance[];
  bookingId: string;
  paymentOption: string;
  paymentAmount?: number;
  fullFeeAmount: number;
}

export function BookingConfirmationEmail({
  contactName,
  schoolName,
  showTitle,
  performances,
  bookingId,
  paymentOption,
  paymentAmount,
  fullFeeAmount,
}: BookingConfirmationEmailProps) {
  const paymentLabel =
    paymentOption === "PINELLAS_COUNTY"
      ? "Pinellas County District Schools (Fully funded)"
      : paymentOption === "PAY_WHAT_YOU_CAN"
      ? `Pay What You Can${paymentAmount ? ` — $${paymentAmount}` : ""}`
      : paymentOption === "HILLSBOROUGH_COUNTY"
      ? `Hillsborough County School — $${paymentAmount ?? (fullFeeAmount * performances.length)}`
      : `Independent and Private schools — $${paymentAmount ?? (fullFeeAmount * performances.length)}`;

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#0a1628",
        color: "#ffffff",
        padding: "40px 20px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p style={{ color: "#c9a84c", fontWeight: "bold", fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", margin: 0 }}>
          American Stage
        </p>
        <p style={{ color: "#9ca3af", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginTop: "4px" }}>
          School Tour
        </p>
      </div>

      <div style={{ backgroundColor: "#112038", borderRadius: "12px", padding: "32px", border: "1px solid #1a2a45" }}>
        <h1 style={{ color: "#c9a84c", fontSize: "24px", marginBottom: "8px" }}>
          Booking Confirmed! 🎭
        </h1>
        <p style={{ color: "#d1d5db", marginBottom: "24px" }}>
          Hi {contactName}, your booking for <strong style={{ color: "#ffffff" }}>{schoolName}</strong> has been confirmed.
        </p>

        <div style={{ borderTop: "1px solid #1a2a45", paddingTop: "20px", marginBottom: "20px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>SHOW</p>
          <p style={{ color: "#ffffff", fontWeight: "bold", fontSize: "18px", margin: 0 }}>{showTitle}</p>
        </div>

        <div style={{ borderTop: "1px solid #1a2a45", paddingTop: "20px", marginBottom: "20px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "12px" }}>PERFORMANCE(S)</p>
          {performances.map((perf, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <p style={{ color: "#ffffff", margin: "0 0 2px 0" }}>
                {perf.date} — <span style={{ color: "#c9a84c", fontWeight: "bold" }}>{perf.timeSlot}</span>
                {perf.customTime && ` (Requested: ${perf.customTime})`}
              </p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>{perf.venueLocation}</p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: "2px 0 0 0" }}>Students: {perf.studentCount}</p>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #1a2a45", paddingTop: "20px", marginBottom: "20px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>PAYMENT</p>
          <p style={{ color: "#ffffff", margin: 0 }}>{paymentLabel}</p>
        </div>

        <div style={{ borderTop: "1px solid #1a2a45", paddingTop: "20px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>BOOKING ID</p>
          <p style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: "12px", margin: 0 }}>{bookingId}</p>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <p style={{ color: "#6b7280", fontSize: "13px" }}>
          Questions? Contact us at{" "}
          <a href="mailto:parbisi@americanstage.org" style={{ color: "#c9a84c" }}>
            parbisi@americanstage.org
          </a>{" "}
          or (727) 685-4014.
        </p>
        <p style={{ color: "#374151", fontSize: "12px", marginTop: "8px" }}>
          © {new Date().getFullYear()} American Stage. All rights reserved.
        </p>
      </div>
    </div>
  );
}
