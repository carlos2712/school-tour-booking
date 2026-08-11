import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ADMIN_EMAIL } from "@/lib/resend";
import { z } from "zod";

const settingsSchema = z.object({
  adminNotificationEmails: z.array(z.string().email("Invalid email address")),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "admin_notification_emails" },
    });

    let emails: string[] = [];
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        if (Array.isArray(parsed)) {
          emails = parsed.map((e) => String(e).trim()).filter(Boolean);
        }
      } catch {
        emails = setting.value.split(",").map((e) => e.trim()).filter(Boolean);
      }
    }

    // Fallback to ADMIN_EMAIL from env if empty
    if (emails.length === 0 && ADMIN_EMAIL) {
      emails = [ADMIN_EMAIL];
    }

    return NextResponse.json({ adminNotificationEmails: emails });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = settingsSchema.parse(body);

    const cleanEmails = Array.from(
      new Set(data.adminNotificationEmails.map((e) => e.trim().toLowerCase()))
    );

    await prisma.setting.upsert({
      where: { key: "admin_notification_emails" },
      update: { value: JSON.stringify(cleanEmails) },
      create: { key: "admin_notification_emails", value: JSON.stringify(cleanEmails) },
    });

    return NextResponse.json({
      success: true,
      adminNotificationEmails: cleanEmails,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
