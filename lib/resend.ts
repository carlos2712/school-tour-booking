import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL =
  process.env.FROM_EMAIL || "American Stage School Tours <onboarding@resend.dev>";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@americanstage.org";
