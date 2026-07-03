import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const homeId = Number(params.id);
  if (!homeId) return NextResponse.json({ error: "Invalid home id." }, { status: 400 });

  const images = await sql`
    SELECT id, sort_order FROM home_images
    WHERE home_id = ${homeId}
    ORDER BY sort_order ASC, id ASC
  `;
  return NextResponse.json({ images });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const homeId = Number(params.id);
  if (!homeId) return NextResponse.json({ error: "Invalid home id." }, { status: 400 });

  const body = await req.json();
  const { data } = body as { data: string };
  if (!data || !data.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid image data." }, { status: 400 });
  }
  // base64 chars ≈ bytes * 1.37; reject anything over ~8 MB
  if (data.length > 11_000_000) {
    return NextResponse.json({ error: "Image too large (max 8 MB)." }, { status: 413 });
  }

  const [maxRow] = await sql`
    SELECT COALESCE(MAX(sort_order), -1) AS m FROM home_images WHERE home_id = ${homeId}
  `;
  const sortOrder = (maxRow.m as number) + 1;

  const [row] = await sql`
    INSERT INTO home_images (home_id, image_data, sort_order)
    VALUES (${homeId}, ${data}, ${sortOrder})
    RETURNING id
  `;
  return NextResponse.json({ id: row.id }, { status: 201 });
}
