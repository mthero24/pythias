import { NextResponse } from "next/server";
import { DesignTemplate } from "@pythias/mongo";

export const dynamic = "force-dynamic";

// Public endpoint — returns only the canvas JSON and field definitions.
// No sensitive data is included.
export async function GET(req) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: true, msg: "Missing id" }, { status: 400 });
  try {
    const t = await DesignTemplate.findById(id)
      .select("name canvasJson canvasWidth canvasHeight customizableFields active")
      .lean();
    if (!t || !t.active) {
      return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: false, template: t },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch (e) {
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}
