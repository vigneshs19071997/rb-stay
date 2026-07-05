import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rows = await sql`SELECT id, name, email, phone FROM users WHERE id = ${session.id}`;
    if (rows.length === 0) return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json({ profile: rows[0] });
  } catch (err) {
    console.error("profile get error", err);
    return NextResponse.json({ error: "Could not load your profile." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const body = await req.json();
    const name = String(body.name || "").trim();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
      }
      const rows = await sql`SELECT password_hash FROM users WHERE id = ${session.id}`;
      const ok = await verifyPassword(currentPassword, rows[0].password_hash as string);
      if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
      }
      const hash = await hashPassword(newPassword);
      await sql`UPDATE users SET name = ${name}, password_hash = ${hash} WHERE id = ${session.id}`;
    } else {
      await sql`UPDATE users SET name = ${name} WHERE id = ${session.id}`;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("profile patch error", err);
    return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
  }
}
