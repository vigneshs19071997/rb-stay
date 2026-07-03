import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  hashPassword,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  type SessionUser,
} from "@/lib/auth";

/** Map a PostgreSQL error to a friendly message, or null if it's not a known constraint. */
function pgConstraintMessage(err: any): string | null {
  if (err?.code !== "23505") return null;
  const c: string = err?.constraint ?? "";
  if (c.includes("email")) return "An account with this email address already exists.";
  if (c.includes("phone")) return "An account with this mobile number already exists.";
  return "An account with these details already exists.";
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const normalizedPhone = String(phone).replace(/\s+/g, "");
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Pre-check uniqueness so we return a clear message even if the DB constraint fires
    const [byPhone, byEmail] = await Promise.all([
      sql`SELECT id FROM users WHERE phone = ${normalizedPhone}`,
      sql`SELECT id FROM users WHERE email = ${normalizedEmail}`,
    ]);
    if (byPhone.length > 0) {
      return NextResponse.json({ error: "An account with this mobile number already exists." }, { status: 409 });
    }
    if (byEmail.length > 0) {
      return NextResponse.json({ error: "An account with this email address already exists." }, { status: 409 });
    }

    const hash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES (${name.trim()}, ${normalizedEmail}, ${normalizedPhone}, ${hash}, 'customer')
      RETURNING id, name, email, role
    `;
    const user = rows[0] as SessionUser;

    const token = await createSessionToken(user);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err: any) {
    console.error("register error", err);
    // Handle any race-condition constraint violations not caught by the pre-checks
    const constraint = pgConstraintMessage(err);
    if (constraint) {
      return NextResponse.json({ error: constraint }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create your account. Please try again." }, { status: 500 });
  }
}
