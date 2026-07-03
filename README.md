# RB Comfort Stay — Homestay Booking Platform

A full-stack booking platform for **RB Comfort Stay** (Sathuvachari, Vellore, Tamil Nadu) with
two homes, account-based customer booking, an admin console, and double-booking protection.

Built with **Next.js 14 (App Router)**, **Neon Postgres**, **bcryptjs** + **jose** (JWT in an
httpOnly cookie), and **Tailwind CSS**. No paid UI libraries — calendar, modals, toasts, and
loaders are all custom.

---

## Features

**Customer**
- Must register an account, then sign in, before booking.
- Calendar date picker: past dates are disabled, and already-booked dates for the selected home are disabled.
- Booking form captures name, district, state, number of days (from the calendar), number of members, and a **mandatory phone number**.
- Capacity is capped at **5 guests per home** — larger parties are rejected.
- View and cancel their own bookings.

**Admin**
- Sees every booking with full customer details (name, phone, email, district, state, dates, members).
- Reschedule any booking's stay dates (with the same overlap protection).
- Cancel any booking.
- Dashboard stats and confirmed/upcoming/cancelled filters.

**Booking integrity**
- Two homes; a confirmed booking blocks those dates for that home.
- Overlap is enforced in the database query at booking and reschedule time, so two people cannot grab the same dates.

---

## Prerequisites

- **Node.js 18.17+** (Node 20 LTS recommended)
- A **Neon Postgres** database — create a free project at <https://neon.tech> and copy its connection string.

---

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — copy the example and fill it in:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/<db>?sslmode=require"
   JWT_SECRET="a-long-random-string-change-this"
   ADMIN_EMAIL="admin@rbcomfortstay.in"
   ADMIN_PASSWORD="ChangeMe@123"
   ```
   - `DATABASE_URL` — your Neon connection string.
   - `JWT_SECRET` — any long random string (used to sign session tokens).
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the admin account created during seeding. **Change the password before going live.**

3. **Create tables and seed data** (two homes + the admin account):
   ```bash
   npm run db:setup
   ```
   This is idempotent — safe to run again.

4. **Run it**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000>.

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

---

## Default admin login

| Field    | Value                        |
| -------- | ---------------------------- |
| Email    | `admin@rbcomfortstay.in`     |
| Password | `ChangeMe@123` (change it!)  |

Customers create their own accounts from the **Register** page.

---

## Deploying

Works on any Node host (Vercel, Hetzner + Coolify, Render, a VPS, etc.):

1. Set the same environment variables (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) in the host's dashboard.
2. Run `npm run db:setup` once against the production database (locally with the prod `DATABASE_URL`, or as a one-off task) to create tables and the admin user.
3. Deploy. Build command `npm run build`, start command `npm start`.

On Vercel, the seed step is run from your machine against the Neon database — the app itself does not seed on boot.

---

## Project structure

```
app/
  page.tsx              Landing page (static): hero, how-it-works, amenities, map, contact
  login/ register/      Auth pages
  book/                 Customer booking flow (calendar + form + confirmation)
  my-bookings/          Customer's own bookings (with cancel)
  admin/                Admin console (details, reschedule, cancel, stats/filters)
  api/
    auth/               register, login, logout, me
    homes/              list homes
    availability/       booked date ranges for a home (drives the calendar)
    bookings/           list + create
    bookings/[id]/      cancel + reschedule
components/             Calendar, Modal, Toast, Spinner, Navbar, Footer, AuthProvider
lib/
  db.ts                 Neon client + MAX_GUESTS
  auth.ts               password hashing, JWT sessions, getSession
  constants.ts          edge-safe shared constants (used by middleware)
  utils.ts              date helpers, classnames
db/
  schema.sql            tables + indexes
  seed.mjs              applies schema, seeds 2 homes + admin
middleware.ts           route protection (/admin = admin only; /book, /my-bookings = signed in)
```

---

## Notes on the booking date model

The calendar lets a guest pick an inclusive range of stay days. Internally these are stored as a
half-open interval `[check_in, check_out)` where `check_out` is the morning after the last night.
Two bookings for the same home clash when `existing.check_in < new.check_out AND existing.check_out > new.check_in`,
which is checked in SQL before any insert or reschedule.

---

## Security notes

- Passwords are hashed with bcrypt; sessions are signed JWTs stored in an httpOnly, SameSite=Lax cookie.
- Change `ADMIN_PASSWORD` and set a strong unique `JWT_SECRET` before production.
- This project pins **Next.js 14.2.35** (the latest patched release on the 14.x line). `npm audit`
  reports two advisories that are only resolved by upgrading to Next 16 (a major breaking change);
  staying on the latest 14.2.x patch is the stable choice for this template. Upgrade to Next 16
  later if you want those cleared.
