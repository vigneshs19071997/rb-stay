import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { normalizeISODate } from "@/lib/utils";

// Queries the database at request time; never prerendered at build.
export const dynamic = "force-dynamic";

// Returns confirmed [check_in, check_out) ranges for a home, used to disable
// already-booked nights in the calendar.
export async function GET(req: NextRequest) {
  try {
    const homeId = Number(req.nextUrl.searchParams.get("homeId"));
    if (!homeId) {
      return NextResponse.json({ error: "homeId is required." }, { status: 400 });
    }

    const rows = await sql`
      SELECT check_in, check_out
      FROM bookings
      WHERE home_id = ${homeId} AND status = 'confirmed' AND check_out >= CURRENT_DATE
      ORDER BY check_in ASC
    `;

    const ranges = rows.map((r: any) => ({
      checkIn: normalizeISODate(r.check_in),
      checkOut: normalizeISODate(r.check_out),
    }));

    return NextResponse.json({ ranges });
  } catch (err) {
    console.error("availability error", err);
    return NextResponse.json({ error: "Could not load availability." }, { status: 500 });
  }
}
