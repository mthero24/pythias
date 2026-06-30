import { NextResponse } from "next/server";
import { PlatformBlank as Blank, Organization } from "@pythias/mongo";

// PUBLIC — feeds the customer "Design & Send In" blank picker for a given shop (?slug=). Returns
// blanks WITH product images, color swatches/images, and sizes.
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const q    = (searchParams.get("q") || "").trim();

    const org = slug ? await Organization.findOne({ slug }).select("_id").lean() : null;
    if (!org) return NextResponse.json({ blanks: [] });

    const filter = { orgId: org._id, active: { $ne: false } };
    if (q) filter.$or = [
        { name:  { $regex: q, $options: "i" } },
        { code:  { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
    ];

    const blanks = await Blank.find(filter)
        .select("name code brand department colors sizes images")
        .populate("colors", "name hexcode image sku")
        .limit(60).lean();

    const out = blanks.map((b) => {
        const colors = (b.colors || []).map((c) => ({ _id: c._id, name: c.name, hexcode: c.hexcode, image: c.image || null }));
        const sizes  = (b.sizes || []).filter((s) => !s.hidden).map((s) => ({ name: s.name, sku: s.sku || "" }));
        const image  = colors.find((c) => c.image)?.image || (b.images || []).find((i) => i.image)?.image || null;
        return { _id: b._id, name: b.name, code: b.code, brand: b.brand || "", department: b.department || "", image, colors, sizes };
    }).filter((b) => b.colors.length && b.sizes.length);

    return NextResponse.json({ blanks: out });
}
