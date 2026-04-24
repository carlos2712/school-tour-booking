import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL =
  "American Stage School Tours <noreply@americanstage.org>";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@americanstage.org";
