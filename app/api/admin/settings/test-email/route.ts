import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resend, FROM_EMAIL } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email recipient provided." },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Test Notification — American Stage School Tours",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827;">
          <h2 style="color: #0a1628;">Test Admin Notification</h2>
          <p>This is a test notification email sent from the American Stage School Tour Booking System.</p>
          <p>If you are receiving this, your admin notification email list is configured correctly!</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">Sent by ${session.user?.email || "Admin"}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error sending test email:", error);
      return NextResponse.json(
        { error: error.message || "Failed to send test email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send test email." },
      { status: 500 }
    );
  }
}
