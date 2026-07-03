import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  type SessionUser,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ error: "Mobile number and password are required." }, { status: 400 });
    }

    const normalizedPhone = String(phone).replace(/\s+/g, "").trim();
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, name, email, phone, role, password_hash
      FROM users WHERE phone = ${normalizedPhone}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Incorrect mobile number or password." }, { status: 401 });
    }

    const row = rows[0] as {
      id: number;
      name: string;
      email: string;
      phone: string;
      role: SessionUser["role"];
      password_hash: string;
    };
    const ok = await verifyPassword(password, row.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect mobile number or password." }, { status: 401 });
    }

    const user: SessionUser = { id: row.id, name: row.name, email: row.email, role: row.role };
    const token = await createSessionToken(user);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
