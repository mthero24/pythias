import { NextResponse } from "next/server";
import { validatePartnerKey } from "@/lib/partnerAuth";
import { PlatformDesign as Design } from "@pythias/mongo";
import { shapeDesign } from "@/lib/partnerShape";
import { recordApiNotification } from "@/lib/recordApiNotification";

// GET /api/partner/designs?page=1&pageSize=50&sku=...&search=...
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
    if (sku) filter.sku = sku;
    if (search) {
        const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ name: rx }, { sku: rx }, { tags: rx }];
    }

    const [designs, total] = await Promise.all([
        Design.find(filter)
            .select("sku name description printType tags images embroideryFiles published")
            .sort({ _id: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        Design.countDocuments(filter),
    ]);

    return NextResponse.json({
        designs: designs.map(shapeDesign),
        total,
        page,
        pages: Math.ceil(total / pageSize),
    });
}

// POST /api/partner/designs
// Upsert one design or an array, keyed by { orgId, sku }.
// Body (single or array): { sku, name, description?, printType?, tags?:[], images?, embroideryFiles? }
export async function POST(req) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    const incoming = Array.isArray(body) ? body : [body];

    const invalid = [];
    incoming.forEach((d, i) => {
        if (!d?.sku?.toString().trim())  invalid.push(`designs[${i}]: sku is required`);
        if (!d?.name?.toString().trim()) invalid.push(`designs[${i}] (${d?.sku ?? "?"}): name is required`);
    });
    if (invalid.length) return NextResponse.json({ error: "Validation failed", details: invalid }, { status: 400 });

    const now = new Date();
    const upserted = [];

    try {
        for (const d of incoming) {
            const sku = d.sku.toString().trim();
            const update = {
                orgId,
                sku,
                name: d.name.toString().trim(),
                ...(d.description     != null ? { description: d.description } : {}),
                ...(d.printType       != null ? { printType: d.printType } : {}),
                ...(Array.isArray(d.tags)      ? { tags: d.tags } : {}),
                ...(d.images          != null ? { images: d.images } : {}),
                ...(d.embroideryFiles != null ? { embroideryFiles: d.embroideryFiles } : {}),
            };

            const before = await Design.findOne({ orgId, sku }).select("_id").lean();
            const design = await Design.findOneAndUpdate(
                { orgId, sku },
                { $set: update },
                { upsert: true, new: true },
            );
            upserted.push({ sku, id: design?._id?.toString() ?? null, created: !before });
        }
    } catch (e) {
        // Design.sku is globally unique — a SKU owned by another org collides here.
        if (e?.code === 11000) {
            recordApiNotification(orgId, {
                level: "error", source: "design.upsert",
                title: "Design upload rejected — SKU already exists",
                message: "A design with this SKU already exists. Design SKUs are globally unique — choose a different SKU.",
                detail: { key: e.keyValue ?? null, statusCode: 409 },
            });
            return NextResponse.json({
                error: "A design with this SKU already exists. Design SKUs are globally unique — choose a different SKU.",
                key: e.keyValue ?? null,
            }, { status: 409 });
        }
        throw e;
    }

    return NextResponse.json({ success: true, upserted, count: upserted.length }, { status: 200 });
}
