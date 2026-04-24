# GEMINI.md - American Stage School Tour Booking

## Project Overview
A self-service booking application for American Stage's School Tour program. Schools can browse the current show, pick available performance dates, and submit a booking with instant confirmation. Administrators can manage show details, dates, and bookings through a protected dashboard.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database/ORM**: Vercel Postgres (Neon) + Prisma ORM
- **Authentication**: NextAuth.js v5 (email magic link)
- **Email**: Resend
- **Calendar**: react-day-picker v9
- **Forms**: React Hook Form + Zod
- **Image Storage**: Vercel Blob

## Key Directories
- `app/` — Next.js App Router routes and pages
  - `page.tsx` — Public landing and booking form
  - `book/confirm/` — Booking confirmation page
  - `admin/` — Admin dashboard and management
    - `login/` — Magic link sign-in
    - `(protected)/` — Auth-guarded admin pages (dashboard, show setup, date management, bookings list)
  - `api/` — Backend API routes (`auth`, `bookings`, `admin`)
- `components/` — Reusable React components
  - `ui/` — Shared UI components
  - `booking-form-wrapper.tsx` — Multi-step public booking form
  - `header.tsx` — Public site header
- `emails/` — Email templates (`booking-confirmation.tsx`, `admin-notification.tsx`)
- `lib/` — Shared utilities (`auth.ts`, `prisma.ts`, `resend.ts`)
- `prisma/` — Database schema (`schema.prisma`)

## Environment Variables
Required in `.env`:
- `DATABASE_URL` — Vercel Postgres connection string
- `AUTH_SECRET` — NextAuth.js secret
- `NEXTAUTH_URL` — Canonical site URL
- `RESEND_API_KEY` — Resend API key for emails
- `ADMIN_EMAIL` — Email address to receive new booking notifications
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token for image storage

## Development Workflows

### Running the Dev Server
```bash
npm run dev
```
- Public booking page: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

### Database Management
```bash
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma Studio to manage data (e.g. seed admin user)
```

## Features
- **Public Flow**: 4-step booking form, interactive calendar (highlighting available dates), AM/PM slot selection, payment options.
- **Admin Panel**: Magic link sign-in, booking stats, show details setup, availability calendar toggle, booking management.

## Coding Standards
- Follow Next.js App Router conventions (server vs. client components).
- Use functional components with TypeScript.
- Use Tailwind CSS for all styling.
- Validate forms and API inputs using Zod.
- Use Prisma client singleton in `lib/prisma.ts` for database operations.
- See `@AGENTS.md` for Next.js 16 breaking changes and conventions.
