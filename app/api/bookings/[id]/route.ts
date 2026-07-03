import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { diffDays, toISODate } from "@/lib/utils";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });

  try {
    const rows = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    const booking = rows[0];

    // A customer may only act on their own booking; admins on any.
    if (session.role !== "admin" && booking.user_id !== session.id) {
      return NextResponse.json({ error: "You can only manage your own bookings." }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body.action || "");

    // --- Cancel (admin: any booking, customer: own) ---
    if (action === "cancel") {
      await sql`UPDATE bookings SET status = 'cancelled' WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    // --- Reschedule (admin only) ---
    if (action === "reschedule") {
      if (session.role !== "admin") {
        return NextResponse.json({ error: "Only an admin can change stay dates." }, { status: 403 });
      }
      const checkIn = String(body.checkIn || "");
      const checkOut = String(body.checkOut || "");
      if (!checkIn || !checkOut) {
        return NextResponse.json({ error: "Both dates are required." }, { status: 400 });
      }
      const numDays = diffDays(checkIn, checkOut);
      if (numDays < 1) {
        return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
      }
      if (checkIn < toISODate(new Date())) {
        return NextResponse.json({ error: "Check-in cannot be in the past." }, { status: 400 });
      }

      // Overlap check excluding this booking itself.
      const clash = await sql`
        SELECT 1 FROM bookings
        WHERE home_id = ${booking.home_id}
          AND status = 'confirmed'
          AND id <> ${id}
          AND check_in < ${checkOut}
          AND check_out > ${checkIn}
        LIMIT 1
      `;
      if (clash.length > 0) {
        return NextResponse.json({ error: "Those dates clash with another confirmed booking." }, { status: 409 });
      }

      await sql`
        UPDATE bookings
        SET check_in = ${checkIn}, check_out = ${checkOut}, num_days = ${numDays}, status = 'confirmed'
        WHERE id = ${id}
      `;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    console.error("patch booking error", err);
    return NextResponse.json({ error: "Could not update the booking." }, { status: 500 });
  }
}
