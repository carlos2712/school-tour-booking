import { prisma } from "@/lib/prisma";
import { ADMIN_EMAIL } from "@/lib/resend";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const setting = await prisma.setting.findUnique({
    where: { key: "admin_notification_emails" },
  });

  let initialEmails: string[] = [];
  if (setting?.value) {
    try {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed)) {
        initialEmails = parsed.map((e) => String(e).trim()).filter(Boolean);
      }
    } catch {
      initialEmails = setting.value.split(",").map((e) => e.trim()).filter(Boolean);
    }
  }

  if (initialEmails.length === 0 && ADMIN_EMAIL) {
    initialEmails = [ADMIN_EMAIL];
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Admin Settings</h1>
        <p className="text-gray-500 text-sm">
          Manage email notifications and recipient lists for school tour bookings.
        </p>
      </div>

      <SettingsForm initialEmails={initialEmails} />
    </div>
  );
}
