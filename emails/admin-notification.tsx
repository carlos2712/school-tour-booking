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
    booking.paymentOption === "PINELLAS_COUNTY"
      ? "Pinellas County District Schools (Fully funded)"
      : booking.paymentOption === "PAY_WHAT_YOU_CAN"
      ? `Pay What You Can${booking.paymentAmount ? ` — $${booking.paymentAmount}` : ""}`
      : booking.paymentOption === "HILLSBOROUGH_COUNTY"
      ? `Hillsborough County School${booking.paymentAmount ? ` — $${booking.paymentAmount}` : ""}`
      : `Independent and Private schools${booking.paymentAmount ? ` — $${booking.paymentAmount}` : ""}`;

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", backgroundColor: "#fff8e6", padding: "32px 20px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "28px", border: "1px solid #ede5d4", boxShadow: "0 2px 8px rgba(86, 57, 141, 0.05)" }}>
        <h2 style={{ color: "#56398d", marginBottom: "4px", marginTop: 0 }}>New School Tour Booking</h2>
        <p style={{ color: "#92278f", fontWeight: "600", marginBottom: "24px" }}>{showTitle}</p>

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
              <tr key={label} style={{ borderBottom: "1px solid #ede5d4" }}>
                <td style={{ padding: "10px 0", color: "#6b7280", fontSize: "13px", width: "120px" }}>{label}</td>
                <td style={{ padding: "10px 0", color: "#111827", fontWeight: "500" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ color: "#56398d", marginTop: "24px", marginBottom: "12px" }}>Performance(s)</h3>
        {performances.map((perf, i) => (
          <div key={i} style={{ backgroundColor: "#fcf8ee", borderRadius: "8px", padding: "12px", marginBottom: "8px", border: "1px solid #e8dfcc" }}>
            <p style={{ margin: "0 0 4px 0", fontWeight: "bold", color: "#56398d" }}>
              {perf.date} — {perf.timeSlot}
              {perf.customTime && ` (Requested: ${perf.customTime})`}
            </p>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "13px" }}>{perf.venueLocation}</p>
            <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "13px" }}>Students: {perf.studentCount}</p>
          </div>
        ))}

        {booking.notes && (
          <div style={{ marginTop: "16px" }}>
            <h3 style={{ color: "#56398d", marginBottom: "8px" }}>Notes</h3>
            <p style={{ color: "#374151", backgroundColor: "#fcf8ee", border: "1px solid #e8dfcc", padding: "12px", borderRadius: "8px" }}>{booking.notes}</p>
          </div>
        )}

        <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "24px", marginBottom: 0 }}>
          Booking ID: {booking.id}
        </p>
      </div>
    </div>
  );
}
