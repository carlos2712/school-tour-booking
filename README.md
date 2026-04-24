# American Stage — School Tour Booking

A self-service booking app for American Stage's School Tour program. Schools can browse the current show, pick available performance dates, and submit a booking — all confirmed instantly. Admins manage show details, dates, and bookings through a protected dashboard.

---

## Features

**Public booking flow**
- Show landing page with title, description, and image gallery
- 4-step booking form: Contact Info → Date & Time → Payment & Extras → Review
- Interactive calendar — only admin-configured dates are selectable (highlighted in gold)
- Supports 1 or 2 performances per booking (same day or different days)
- AM / PM time slot selection
- Payment options: Free, Pay What You Can, Full Fee
- Confirmation page + automated email to the school on submit

**Admin panel** (`/admin`)
- Magic link sign-in (no password)
- Dashboard with booking stats
- Show setup: title, description, images, pricing, custom questions
- Date manager: add/remove AM & PM slots per day, toggle availability, see booked slots
- Bookings list: view all bookings, cancel and free up slots, change status

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Vercel Postgres (Neon) + Prisma ORM |
| Auth | NextAuth.js v5 — email magic link |
| Email | Resend |
| Styling | Tailwind CSS |
| Calendar | react-day-picker v9 |
| Forms | React Hook Form + Zod |
| Image storage | Vercel Blob |

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env` and fill in the values:

```env
DATABASE_URL="..."           # Vercel Postgres connection string
AUTH_SECRET="..."            # Run: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."      # From resend.com
ADMIN_EMAIL="you@email.com"  # Receives new booking notifications
BLOB_READ_WRITE_TOKEN="..."  # From Vercel Blob (optional for local)
```

### 3. Run database migrations

```bash
npx prisma migrate dev
```

### 4. Seed your admin user

```bash
npx prisma studio
```

Open the `User` table and add a row with your email address.

### 5. Start the dev server

```bash
npm run dev
```

- Public booking page: [http://localhost:3000](http://localhost:3000)
- Admin login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## Deployment (Vercel)

1. Push to GitHub and import the repo in [vercel.com](https://vercel.com)
2. Add all environment variables in the Vercel dashboard
3. Connect **Vercel Postgres** (Neon) from the Storage tab — copy the `DATABASE_URL` into env vars
4. Connect **Vercel Blob** from the Storage tab — copy the `BLOB_READ_WRITE_TOKEN`
5. Deploy — Prisma migrations run automatically on first boot via `prisma migrate deploy`

---

## Project Structure

```
app/
  page.tsx                   # Public landing + booking form
  book/confirm/              # Booking confirmation page
  admin/
    login/                   # Magic link sign-in
    (protected)/             # Auth-guarded admin pages
      page.tsx               # Dashboard
      show/                  # Show setup
      dates/                 # Date management
      bookings/              # Bookings list + detail
  api/
    auth/[...nextauth]/      # NextAuth handler
    bookings/                # Public booking API
    admin/                   # Admin CRUD APIs
components/
  booking-form-wrapper.tsx   # Multi-step public booking form
  header.tsx                 # Public site header
  ui/                        # Shared UI components
emails/
  booking-confirmation.tsx   # Email to school on booking
  admin-notification.tsx     # Email to admin on new booking
lib/
  auth.ts                    # NextAuth config
  prisma.ts                  # Prisma client singleton
  resend.ts                  # Resend client
prisma/
  schema.prisma              # Database schema
```

---

## Admin Quick Start

1. Sign in at `/admin/login` with your registered email
2. Go to **Show Setup** — create your show with title, description, and images
3. Go to **Manage Dates** — click days on the calendar to add AM/PM slots
4. Share the public URL with schools — they'll see the active show and available dates immediately
