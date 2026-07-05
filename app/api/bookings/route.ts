import { NextRequest, NextResponse } from "next/server";
import { sql, MAX_GUESTS } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { diffDays, toISODate, normalizeISODate } from "@/lib/utils";
import { ROOM_TYPES, getRoomType } from "@/lib/constants";

// Reads session and queries the database at request time; never prerendered.
export const dynamic = "force-dynamic";

function serialize(r: any) {
  return {
    id: r.id,
    homeId: r.home_id,
    homeName: r.home_name,
    userId: r.user_id,
    guestName: r.guest_name,
    district: r.district,
    state: r.state,
    phone: r.phone,
    numMembers: r.num_members,
    numDays: r.num_days,
    checkIn: normalizeISODate(r.check_in),
    checkOut: normalizeISODate(r.check_out),
    status: r.status,
    email: r.email ?? null,
    createdAt: r.created_at,
    roomType: r.room_type ?? "non_ac_non_ac",
    pricePerNight: r.price_per_night ?? 2100,
    totalPrice: r.total_price ?? 0,
  };
}

// GET — admin sees every booking; a customer sees only their own.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  try {
    const rows =
      session.role === "admin"
        ? await sql`
            SELECT b.*, h.name AS home_name, u.email
            FROM bookings b
            JOIN homes h ON h.id = b.home_id
            JOIN users u ON u.id = b.user_id
            ORDER BY b.check_in DESC, b.id DESC
          `
        : await sql`
            SELECT b.*, h.name AS home_name
            FROM bookings b
            JOIN homes h ON h.id = b.home_id
            WHERE b.user_id = ${session.id}
            ORDER BY b.check_in DESC, b.id DESC
          `;
    return NextResponse.json({ bookings: rows.map(serialize) });
  } catch (err) {
    console.error("list bookings error", err);
    return NextResponse.json({ error: "Could not load bookings." }, { status: 500 });
  }
}

// POST — a signed-in customer creates a booking.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in to book." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const homeId = Number(body.homeId);
    const guestName = String(body.guestName || "").trim();
    const district = String(body.district || "").trim();
    const state = String(body.state || "").trim();
    const phone = String(body.phone || "").replace(/\s+/g, "");
    const numMembers = Number(body.numMembers);
    const checkIn = String(body.checkIn || "");
    const checkOut = String(body.checkOut || "");
    const roomType = String(body.roomType || "");

    // Field validation (district and state are optional)
    if (!homeId || !guestName || !phone || !numMembers || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }
    if (numMembers < 1 || numMembers > MAX_GUESTS) {
      return NextResponse.json(
        { error: `Each home hosts a maximum of ${MAX_GUESTS} guests.` },
        { status: 400 }
      );
    }

    const selectedRoom = getRoomType(roomType);
    if (!selectedRoom) {
      return NextResponse.json({ error: "Please select a valid room type." }, { status: 400 });
    }

    const numDays = diffDays(checkIn, checkOut);
    if (numDays < 1) {
      return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
    }

    // No bookings starting in the past.
    const today = toISODate(new Date());
    if (checkIn < today) {
      return NextResponse.json({ error: "Check-in cannot be in the past." }, { status: 400 });
    }

    // The home must exist; enforce its own capacity.
    const homeRows = await sql`SELECT id, max_guests FROM homes WHERE id = ${homeId}`;
    if (homeRows.length === 0) {
      return NextResponse.json({ error: "Selected home was not found." }, { status: 404 });
    }
    if (numMembers > homeRows[0].max_guests) {
      return NextResponse.json(
        { error: `This home hosts a maximum of ${homeRows[0].max_guests} guests.` },
        { status: 400 }
      );
    }

    // Overlap check (half-open intervals).
    const clash = await sql`
      SELECT 1 FROM bookings
      WHERE home_id = ${homeId}
        AND status = 'confirmed'
        AND check_in < ${checkOut}
        AND check_out > ${checkIn}
      LIMIT 1
    `;
    if (clash.length > 0) {
      return NextResponse.json(
        { error: "Sorry, those dates were just taken. Please pick different dates." },
        { status: 409 }
      );
    }

    const pricePerNight = selectedRoom.price;
    const totalPrice = pricePerNight * numDays;

    const inserted = await sql`
      INSERT INTO bookings
        (home_id, user_id, guest_name, district, state, phone, num_members, num_days,
         check_in, check_out, status, room_type, price_per_night, total_price)
      VALUES
        (${homeId}, ${session.id}, ${guestName}, ${district}, ${state}, ${phone},
         ${numMembers}, ${numDays}, ${checkIn}, ${checkOut}, 'confirmed',
         ${selectedRoom.id}, ${pricePerNight}, ${totalPrice})
      RETURNING *
    `;
    const homeName = await sql`SELECT name FROM homes WHERE id = ${homeId}`;
    const result = serialize({ ...inserted[0], home_name: homeName[0]?.name });
    return NextResponse.json({ booking: result }, { status: 201 });
  } catch (err) {
    console.error("create booking error", err);
    return NextResponse.json({ error: "Could not complete your booking. Please try again." }, { status: 500 });
  }
}
