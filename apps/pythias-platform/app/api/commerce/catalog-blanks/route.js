export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformBlank, ProviderCatalog, PlatformProduct } from "@pythias/mongo";

const sizeSku = (name) => String(name ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "OS";

// GET /api/commerce/catalog-blanks — the seller's catalog blanks
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const blanks = await PlatformBlank.find({ orgId, catalogBlank: true })
        .populate("colors", "name hexcode sku")
        .select("code name manufacturerStyle platformPrice colors sizes images active")
        .lean();
    return NextResponse.json({ error: false, blanks });
}

// POST /api/commerce/catalog-blanks
// "Add a provider garment to my catalog" — creates an org-scoped alias blank keyed on
// manufacturer style. Body:
// { manufacturerStyle, name?, colors:[colorId], sizes:[name], images:{ colorId: imageUrl } }
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const body = await req.json().catch(() => null);
    const mfr = body?.manufacturerStyle?.toString().trim();
    if (!mfr) return NextResponse.json({ error: "manufacturerStyle is required" }, { status: 400 });
    if (!Array.isArray(body.colors) || !body.colors.length) return NextResponse.json({ error: "Select at least one color" }, { status: 400 });
    if (!Array.isArray(body.sizes)  || !body.sizes.length)  return NextResponse.json({ error: "Select at least one size" }, { status: 400 });

    // Already added?
    const existing = await PlatformBlank.findOne({ orgId, catalogBlank: true, $or: [{ manufacturerStyle: mfr }, { code: `CC-${orgId.toString().slice(-6)}-${mfr}` }] }).select("_id").lean();
    if (existing) return NextResponse.json({ error: "This garment is already in your catalog" }, { status: 409 });

    // Resolve canonical source blanks for this manufacturer style that providers actually carry
    const candidates = await PlatformBlank.find({ $or: [{ manufacturerStyle: mfr }, { code: mfr }] }).select("_id code manufacturerStyle name images sizes").lean();
    const candidateIds = candidates.map(c => c._id);
    const inCatalog = await ProviderCatalog.find({ active: true, blankId: { $in: candidateIds } }).distinct("blankId");
    const sourceBlankIds = inCatalog.map(id => id.toString());
    if (!sourceBlankIds.length) {
        return NextResponse.json({ error: "No provider currently carries this garment" }, { status: 400 });
    }
    const sourceBlank = candidates.find(c => sourceBlankIds.includes(c._id.toString())) ?? candidates[0];

    // Per-size pricing carried from the source garment so product variants default correctly.
    // wholesalePrice = the seller's cost basis (provider sell price); retailPrice = default
    // retail (seller-overridable). Premier's raw wholesaleCost is never exposed to the seller.
    const srcSizeByName = {};
    for (const c of candidates) {
        if (!sourceBlankIds.includes(c._id.toString())) continue;
        for (const s of (c.sizes ?? [])) {
            const key = String(s.name).trim().toLowerCase();
            if (!srcSizeByName[key]) srcSizeByName[key] = s;
        }
    }
    const retailOverride = Number(body.retailPrice);              // dollars; optional flat override for all sizes
    const hasRetailOverride = !isNaN(retailOverride) && retailOverride > 0;
    const sizes = body.sizes.map((name) => {
        const s = srcSizeByName[String(name).trim().toLowerCase()] ?? {};
        const cost = (s.wholesalePrice ?? 0) || 12;              // seller's cost = provider sell price ($12 floor)
        return {
            name:           String(name),
            sku:            sizeSku(name),
            wholesalePrice: cost,
            wholesaleCost:  cost,
            costPerItem:    cost,
            retailPrice:    hasRetailOverride ? retailOverride : (s.retailPrice ?? 0),
            compareAtPrice: s.compareAtPrice ?? 0,
            weight:         s.weight ?? 0,
        };
    });

    // Headline platform price (cents) = highest provider wholesale across the garment's sizes.
    const pricedEntries = await ProviderCatalog.find({ active: true, blankId: { $in: candidateIds } }).select("wholesalePrice").lean();
    const platformPrice = pricedEntries.reduce((mx, e) => Math.max(mx, e.wholesalePrice ?? 0), 0) || Number(body.platformPrice) || 0;

    // Images: inherit the source blank's real mockup templates — they carry the print
    // `boxes` that /api/renderImages needs to composite the design. Filtered to the colors
    // the seller selected. Without these the alias has empty boxes and AI products render blank.
    const selectedColors = new Set(body.colors.map(String));
    const sourceImages = candidates
        .filter((c) => sourceBlankIds.includes(c._id.toString()))
        .flatMap((c) => c.images ?? [])
        .filter((im) => im?.image && (!im.color || selectedColors.has(String(im.color))));

    // Seller-uploaded thumbnails (no boxes) — only as a fallback for colors with no source image
    const imagesIn = body.images && typeof body.images === "object" ? body.images : {};
    const coveredColors = new Set(sourceImages.map((im) => String(im.color)));
    const uploadFallback = body.colors
        .filter((cid) => imagesIn[cid] && !coveredColors.has(String(cid)))
        .map((cid) => ({ image: imagesIn[cid], color: cid, imageGroup: "default", boxes: {} }));

    const images = [...sourceImages, ...uploadFallback];

    const code = `CC-${orgId.toString().slice(-6)}-${mfr}`.replace(/[^A-Za-z0-9-]/g, "");

    const created = await PlatformBlank.create({
        orgId,
        type:             "alias",
        catalogBlank:     true,
        manufacturerStyle: mfr,
        platformPrice,                                        // cents, platform-controlled
        name:             body.name?.toString().trim() || sourceBlank?.name || mfr,
        code,
        colors:           body.colors,
        sizes,
        blanks:           sourceBlankIds,                     // canonical refs → routeOrder resolves alias→canonical
        images,
        active:           true,
        retailOverridden: hasRetailOverride,                  // seller set their own retail → sync won't overwrite it
    });

    return NextResponse.json({ error: false, blank: { _id: created._id.toString(), code, manufacturerStyle: mfr } }, { status: 201 });
}

// PUT /api/commerce/catalog-blanks — update a catalog garment's retail price.
// Body: { id, retailPrice }  (retailPrice in dollars; applied to every size)
export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const body = await req.json().catch(() => null);
    const id = body?.id;
    const price = Number(body?.retailPrice);
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (isNaN(price) || price < 0) return NextResponse.json({ error: "Valid retailPrice required" }, { status: 400 });

    const blank = await PlatformBlank.findOne({ _id: id, orgId, catalogBlank: true }).select("_id").lean();
    if (!blank) return NextResponse.json({ error: "Garment not found in your catalog" }, { status: 404 });

    // Apply to all sizes and flag as seller-overridden so the Premier sync won't reset it.
    await PlatformBlank.updateOne(
        { _id: blank._id, orgId, catalogBlank: true },
        { $set: { "sizes.$[].retailPrice": price, retailOverridden: true } }
    );
    return NextResponse.json({ error: false });
}

// DELETE /api/commerce/catalog-blanks?id=<aliasBlankId> — remove a garment from the seller's catalog
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Only ever delete this org's own catalog alias — never a provider source blank.
    const blank = await PlatformBlank.findOne({ _id: id, orgId, catalogBlank: true }).select("_id").lean();
    if (!blank) return NextResponse.json({ error: "Garment not found in your catalog" }, { status: 404 });

    // Block removal while products are built on it — those would be orphaned.
    const productCount = await PlatformProduct.countDocuments({ orgId, blanks: blank._id });
    if (productCount > 0) {
        return NextResponse.json({ error: `Can't remove — ${productCount} product${productCount === 1 ? "" : "s"} use this garment. Delete those products first.` }, { status: 409 });
    }

    await PlatformBlank.deleteOne({ _id: blank._id, orgId, catalogBlank: true });
    return NextResponse.json({ error: false });
}
