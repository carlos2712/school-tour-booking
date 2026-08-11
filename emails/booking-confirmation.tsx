import * as React from "react";
import { format, subDays } from "date-fns";

interface Performance {
  date: string; // Formatted date string e.g. "Wednesday, October 15, 2025" or raw date
  timeSlot: string;
  venueLocation: string;
  studentCount: number;
  customTime?: string;
  preferredAlternateDate?: string;
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
  phone?: string;
  grades?: string;
  notes?: string;
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
  phone,
  grades,
  notes,
}: BookingConfirmationEmailProps) {
  const paymentLabel =
    paymentOption === "PINELLAS_COUNTY"
      ? "Pinellas County District Schools (Fully funded)"
      : paymentOption === "PAY_WHAT_YOU_CAN"
        ? `Pay What You Can${paymentAmount ? ` — $${paymentAmount}` : ""}`
        : paymentOption === "HILLSBOROUGH_COUNTY"
          ? `Hillsborough County School — $${paymentAmount ?? (fullFeeAmount * performances.length)}`
          : `Independent, Charter and Private schools — $${paymentAmount ?? (fullFeeAmount * performances.length)}`;

  // Calculate estimated study guide delivery date (2 weeks prior to first performance date)
  let studyGuideDateNotice = "2 weeks prior to your performance date";
  if (performances.length > 0 && performances[0].date) {
    try {
      const perfDate = new Date(performances[0].date);
      if (!isNaN(perfDate.getTime())) {
        const guideDate = subDays(perfDate, 14);
        studyGuideDateNotice = `on or before ${format(guideDate, "EEEE, MMMM d, yyyy")} (2 weeks prior to performance)`;
      }
    } catch {
      // Fallback if parsing fails
    }
  }

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        backgroundColor: "#0a1628",
        color: "#ffffff",
        padding: "40px 20px",
        maxWidth: "640px",
        margin: "0 auto",
      }}
    >
      {/* Header logo & title */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <p
          style={{
            color: "#c9a84c",
            fontWeight: "bold",
            fontSize: "13px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          American Stage
        </p>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "11px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginTop: "4px",
          }}
        >
          School Tour Booking Confirmation
        </p>
      </div>

      {/* Main card container */}
      <div
        style={{
          backgroundColor: "#112038",
          borderRadius: "12px",
          padding: "32px",
          border: "1px solid #1a2a45",
        }}
      >
        <h1
          style={{
            color: "#c9a84c",
            fontSize: "24px",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          Booking Confirmed! 🎭
        </h1>
        <p style={{ color: "#d1d5db", fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>
          Hi <strong style={{ color: "#ffffff" }}>{contactName}</strong>, thank you for booking a School Tour with American Stage! Your reservation for <strong style={{ color: "#ffffff" }}>{schoolName}</strong> has been successfully placed.
        </p>

        {/* Booking & Contact Overview */}
        <div style={{ borderTop: "1px solid #1a2a45", paddingTop: "20px", marginBottom: "20px" }}>
          <p style={{ color: "#c9a84c", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>
            BOOKING DETAILS
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <tbody>
              <tr>
                <td style={{ color: "#9ca3af", padding: "4px 0", width: "130px" }}>School Name:</td>
                <td style={{ color: "#ffffff", fontWeight: "600", padding: "4px 0" }}>{schoolName}</td>
              </tr>
              <tr>
                <td style={{ color: "#9ca3af", padding: "4px 0" }}>Contact Person:</td>
                <td style={{ color: "#ffffff", padding: "4px 0" }}>{contactName}</td>
              </tr>
              {phone && (
                <tr>
                  <td style={{ color: "#9ca3af", padding: "4px 0" }}>Phone:</td>
                  <td style={{ color: "#ffffff", padding: "4px 0" }}>{phone}</td>
                </tr>
              )}
              {grades && (
                <tr>
                  <td style={{ color: "#9ca3af", padding: "4px 0" }}>Grade Level(s):</td>
                  <td style={{ color: "#ffffff", padding: "4px 0" }}>{grades}</td>
                </tr>
              )}
              <tr>
                <td style={{ color: "#9ca3af", padding: "4px 0" }}>Show Title:</td>
                <td style={{ color: "#c9a84c", fontWeight: "bold", padding: "4px 0" }}>{showTitle}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Performances Section */}
        <div style={{ borderTop: "1px solid #1a2a45", paddingTop: "20px", marginBottom: "20px" }}>
          <p style={{ color: "#c9a84c", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px", marginBottom: "12px" }}>
            PERFORMANCE SCHEDULE ({performances.length})
          </p>
          {performances.map((perf, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#0a1628",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: i < performances.length - 1 ? "12px" : "0",
                border: "1px solid #1a2a45",
              }}
            >
              <p style={{ color: "#ffffff", fontWeight: "bold", fontSize: "15px", margin: "0 0 6px 0" }}>
                Performance #{i + 1}: {perf.date}
              </p>
              <p style={{ color: "#d1d5db", fontSize: "13px", margin: "0 0 4px 0" }}>
                Time Slot: <span style={{ color: "#c9a84c", fontWeight: "bold" }}>{perf.timeSlot}</span>
                {perf.customTime && ` (Requested: ${perf.customTime})`}
              </p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: "0 0 4px 0" }}>
                Location: {perf.venueLocation}
              </p>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                Students Attending: {perf.studentCount}
              </p>
              {perf.preferredAlternateDate && (
                <p style={{ color: "#6b7280", fontSize: "12px", margin: "6px 0 0 0" }}>
                  Preferred Alternate: {perf.preferredAlternateDate}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Study Guide Announcement Banner */}
        <div
          style={{
            backgroundColor: "#1c2e4a",
            borderLeft: "4px solid #c9a84c",
            borderRadius: "6px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <p style={{ color: "#c9a84c", fontWeight: "bold", fontSize: "14px", margin: "0 0 6px 0" }}>
            📚 Educational Study Guide Information
          </p>
          <p style={{ color: "#d1d5db", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
            To help your teachers and students prepare for the show, your official Study Guide will be emailed to you <strong>{studyGuideDateNotice}</strong>.
          </p>
          <p style={{ color: "#9ca3af", fontSize: "12px", lineHeight: "1.4", marginTop: "8px", marginBottom: 0 }}>
            Please be sure to circulate the guide among all participating teachers and students ahead of time so everyone can engage with the educational materials prior to the performance!
          </p>
        </div>

        {/* Payment Summary */}
        <div style={{ borderTop: "1px solid #1a2a45", paddingTop: "20px", marginBottom: "20px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>PAYMENT METHOD</p>
          <p style={{ color: "#ffffff", fontWeight: "500", margin: 0 }}>{paymentLabel}</p>
        </div>

        {/* Notes (if provided) */}
        {notes && (
          <div style={{ borderTop: "1px solid #1a2a45", paddingTop: "20px", marginBottom: "20px" }}>
            <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>SPECIAL NOTES / REQUESTS</p>
            <p style={{ color: "#d1d5db", fontSize: "13px", margin: 0, whiteSpace: "pre-wrap" }}>{notes}</p>
          </div>
        )}

        {/* Booking ID */}
        <div style={{ borderTop: "1px solid #1a2a45", paddingTop: "20px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>BOOKING ID</p>
          <p style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: "12px", margin: 0 }}>{bookingId}</p>
        </div>
      </div>

      {/* Support & Contact Footer */}
      <div style={{ textAlign: "center", marginTop: "32px" }}>
        <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.5", margin: 0 }}>
          If you have any questions or concerns about your booking, please reach out to our Education Team at:
        </p>
        <p style={{ marginTop: "6px", marginBottom: "16px" }}>
          <a
            href="mailto:education@americanstage.org"
            style={{
              color: "#c9a84c",
              fontWeight: "bold",
              fontSize: "14px",
              textDecoration: "underline",
            }}
          >
            education@americanstage.org
          </a>
        </p>
        <p style={{ color: "#4b5563", fontSize: "12px", margin: 0 }}>
          © {new Date().getFullYear()} American Stage. All rights reserved.
        </p>
      </div>
    </div>
  );
}
