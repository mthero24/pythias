import { NextResponse } from "next/server";
import { Blanks } from "@pythias/mongo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const blanks = await Blanks.find({ active: true })
      .populate("colors")
      .select("name code brand category description box images colors sizes")
      .lean();

    const formatted = blanks.map(b => ({
      _id: b._id,
      name: b.name,
      code: b.code,
      brand: b.brand,
      category: b.category,
      description: b.description,
      box: b.box,
      images: (b.images || []).map(img => ({
        image: img.image,
        color: img.color,
        imageGroup: img.imageGroup,
        boxes: img.boxes,
      })),
      colors: (b.colors || []).map(c => ({
        _id: c._id,
        name: c.name,
        hexcode: c.hexcode,
        image: c.image,
        colorFamily: c.colorFamily,
      })),
      sizes: (b.sizes || [])
        .filter(s => !s.hidden && s.retailPrice > 0)
        .map(s => ({ _id: s._id, name: s.name, retailPrice: s.retailPrice })),
    }));

    return NextResponse.json(
      { error: false, blanks: formatted },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (e) {
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}
