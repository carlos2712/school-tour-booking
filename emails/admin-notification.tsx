import * as React from "react";

interface Performance {
  date: string;
  timeSlot: string;
  venueLocation: string;
  studentCount: number;
  customTime?: string;
}

interface AdminNotificationEmailProps {
  booking: {
    id: string;
    schoolName: string;
    contactName: string;
    email: string;
    phone: string;
    grades: string;
    paymentOption: string;
    paymentAmount?: number;
    notes?: string;
  };
  showTitle: string;
  performances: Performance[];
}

export function AdminNotificationEmail({
  booking,
  showTitle,
  performances,
}: AdminNotificationEmailProps) {
  const paymentLabel =
    booking.paymentOption === "FREE"
      ? "Free Performance"
      : booking.paymentOption === "PAY_WHAT_YOU_CAN"
      ? `Pay What You Can${booking.paymentAmount ? ` — $${booking.paymentAmount}` : ""}`
      : "Full Fee";

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f9fafb", padding: "32px 20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ color: "#0a1628", marginBottom: "4px" }}>New School Tour Booking</h2>
      <p style={{ color: "#6b7280", marginBottom: "24px" }}>{showTitle}</p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {[
            ["School", booking.schoolName],
            ["Contact", booking.contactName],
            ["Email", booking.email],
            ["Phone", booking.phone],
            ["Grades", booking.grades],
            ["Payment", paymentLabel],
          ].map(([label, value]) => (
            <tr key={label} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "13px", width: "120px" }}>{label}</td>
              <td style={{ padding: "10px 0", color: "#111827", fontWeight: "500" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ color: "#0a1628", marginTop: "24px", marginBottom: "12px" }}>Performance(s)</h3>
      {performances.map((perf, i) => (
        <div key={i} style={{ backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
          <p style={{ margin: "0 0 4px 0", fontWeight: "bold", color: "#0a1628" }}>
            {perf.date} — {perf.timeSlot}
            {perf.customTime && ` (Requested: ${perf.customTime})`}
          </p>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>{perf.venueLocation}</p>
          <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "13px" }}>Students: {perf.studentCount}</p>
        </div>
      ))}

      {booking.notes && (
        <div style={{ marginTop: "16px" }}>
          <h3 style={{ color: "#0a1628", marginBottom: "8px" }}>Notes</h3>
          <p style={{ color: "#374151", backgroundColor: "#f3f4f6", padding: "12px", borderRadius: "8px" }}>{booking.notes}</p>
        </div>
      )}

      <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px" }}>
        Booking ID: {booking.id}
      </p>
    </div>
  );
}
