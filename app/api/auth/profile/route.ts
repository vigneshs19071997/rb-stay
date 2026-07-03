import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

function pgConstraintMessage(err: any): string | null {
  if (err?.code !== "23505") return null;
  const c: string = err?.constraint ?? "";
  if (c.includes("phone")) return "That mobile number is already in use by another account.";
  if (c.includes("email")) return "That email address is already in use by another account.";
  return "Those details are already in use.";
}

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
    const phone = String(body.phone || "").replace(/\s+/g, "").trim();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    // Check phone uniqueness (skip own record)
    if (phone) {
      const clash = await sql`SELECT id FROM users WHERE phone = ${phone} AND id <> ${session.id}`;
      if (clash.length > 0) {
        return NextResponse.json({ error: "That mobile number is already in use." }, { status: 409 });
      }
    }

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
      await sql`
        UPDATE users SET name = ${name}, phone = ${phone}, password_hash = ${hash}
        WHERE id = ${session.id}
      `;
    } else {
      await sql`UPDATE users SET name = ${name}, phone = ${phone} WHERE id = ${session.id}`;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("profile patch error", err);
    const constraint = pgConstraintMessage(err);
    if (constraint) return NextResponse.json({ error: constraint }, { status: 409 });
    return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
  }
}
