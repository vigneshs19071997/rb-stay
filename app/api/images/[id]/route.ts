import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  const rows = await sql`SELECT image_data FROM home_images WHERE id = ${id}`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const dataUrl: string = rows[0].image_data;
  const comma = dataUrl.indexOf(",");
  const header = comma !== -1 ? dataUrl.slice(0, comma) : "";
  const base64 = comma !== -1 ? dataUrl.slice(comma + 1) : "";
  const ctMatch = header.match(/^data:([^;]+);base64$/);
  if (!ctMatch || !base64) return NextResponse.json({ error: "Corrupt image data." }, { status: 500 });

  const contentType = ctMatch[1];
  const buffer = Buffer.from(base64, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id." }, { status: 400 });

  await sql`DELETE FROM home_images WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
