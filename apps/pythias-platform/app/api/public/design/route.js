import { NextResponse } from "next/server";
import { Design, DesignTemplate } from "@pythias/mongo";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/design?id={designId}
 *
 * Returns the data the customer customization page needs:
 *   - printType           ("EMB" | "VIN" | "DTF" …)
 *   - embroideryFiles     { polygonsUrl, dst, vinylSvg }
 *   - customizableFields  from the linked design template (if any)
 *   - threadColors        colour options stored on the design
 */
export async function GET(req) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: true, msg: "Missing id" }, { status: 400 });

  try {
    const design = await Design.findById(id)
      .select("printType embroideryFiles designTemplateId threadColors")
      .lean();

    if (!design) {
      return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });
    }

    // Pull customizable fields from the linked template, if one exists
    let customizableFields = [];
    if (design.designTemplateId) {
      const tmpl = await DesignTemplate.findById(design.designTemplateId)
        .select("customizableFields")
        .lean();
      if (tmpl) customizableFields = tmpl.customizableFields || [];
    }

    return NextResponse.json(
      {
        error: false,
        design: {
          printType:         design.printType,
          embroideryFiles:   design.embroideryFiles || {},
          customizableFields,
          threadColors:      design.threadColors || [],
        },
      },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch (e) {
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}
