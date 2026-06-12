import { NextResponse } from "next/server";
import { validatePartnerKey } from "@/lib/partnerAuth";
import { PlatformProduct as Products } from "@pythias/mongo";
import { shapeProduct } from "@/lib/partnerShape";

// GET /api/partner/products?page=1&pageSize=50&sku=...&search=...
// List the org's catalog.
export async function GET(req) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10) || 50));
    const sku      = searchParams.get("sku")?.trim();
    const search   = searchParams.get("search")?.trim();

    const filter = { orgId };
    if (sku)    filter.$or = [{ sku }, { "variantsArray.sku": sku }];
    if (search) filter.$text = { $search: search };

    const [products, total] = await Promise.all([
        Products.find(filter)
            .populate("variantsArray.color", "name hexcode sku")
            .populate("blanks", "code name sizes")
            .select("title sku brand description productImages variantsArray blanks lastUpdated createdAt")
            .sort({ _id: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        Products.countDocuments(filter),
    ]);

    return NextResponse.json({
        products: products.map(shapeProduct),
        total,
        page,
        pages: Math.ceil(total / pageSize),
    });
}

// POST /api/partner/products
// Upsert one product or an array of products, keyed by { orgId, sku }.
// Body (single or array):
// { sku, title, brand?, description?, images?:[url],
//   variants:[{ sku, price?, color?, size?, image?, upc? }] }
export async function POST(req) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    const incoming = Array.isArray(body) ? body : [body];

    // Validate
    const invalid = [];
    incoming.forEach((p, i) => {
        if (!p?.sku?.toString().trim())        invalid.push(`products[${i}]: sku is required`);
        else if (!Array.isArray(p.variants) || p.variants.length === 0)
            invalid.push(`products[${i}] (${p.sku}): at least one variant is required`);
        else p.variants.forEach((v, j) => {
            if (!v?.sku?.toString().trim()) invalid.push(`products[${i}].variants[${j}]: sku is required`);
        });
    });
    if (invalid.length) return NextResponse.json({ error: "Validation failed", details: invalid }, { status: 400 });

    const now = new Date();
    const upserted = [];

    for (const p of incoming) {
        const sku = p.sku.toString().trim();

        // Storefronts send color/size as display names. variantsArray.color is an
        // ObjectId ref (can't hold a name) — keep names in the freeform `ids` field
        // and put the size name in `size` (a String). Refs stay null until mapped.
        const variantsArray = p.variants.map((v) => ({
            sku:    v.sku.toString().trim(),
            price:  v.price != null ? Number(v.price) : undefined,
            image:  v.image ?? undefined,
            images: Array.isArray(v.images) ? v.images : undefined,
            upc:    v.upc ?? undefined,
            gtin:   v.gtin ?? undefined,
            size:   v.size != null ? String(v.size) : undefined,
            ids:    { colorName: v.color ?? null, sizeName: v.size != null ? String(v.size) : null },
        }));

        const productImages = Array.isArray(p.images)
            ? p.images.filter(Boolean).map((image) => ({ image }))
            : undefined;

        const update = {
            orgId,
            sku,
            title:       p.title ?? sku,
            ...(p.brand       != null ? { brand: p.brand } : {}),
            ...(p.description != null ? { description: p.description } : {}),
            ...(productImages          ? { productImages } : {}),
            variantsArray,
            lastUpdated: now,
        };

        const before = await Products.findOne({ orgId, sku }).select("_id").lean();
        const product = await Products.findOneAndUpdate(
            { orgId, sku },
            { $set: update, $setOnInsert: { createdAt: now } },
            { upsert: true, new: true },
        );
        upserted.push({ sku, id: product?._id?.toString() ?? null, created: !before });
    }

    return NextResponse.json({ success: true, upserted, count: upserted.length }, { status: 200 });
}
