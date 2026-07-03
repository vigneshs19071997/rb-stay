import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Queries the database at request time; never prerendered at build.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const homes = await sql`
      SELECT id, name, description, max_guests
      FROM homes ORDER BY id ASC
    `;
    return NextResponse.json({ homes });
  } catch (err) {
    console.error("homes error", err);
    return NextResponse.json({ error: "Could not load homes." }, { status: 500 });
  }
}
