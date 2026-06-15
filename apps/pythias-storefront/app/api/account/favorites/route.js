export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

// Keep only the fields we persist; cap sizes so a client can't bloat the doc.
function clean(line) {
    return {
        productId: String(line?.productId ?? ""),
        sku: line?.sku ? String(line.sku) : "",
        title: line?.title ? String(line.title).slice(0, 200) : "",
        image: line?.image ? String(line.image).slice(0, 600) : "",
        color: line?.color ? String(line.color).slice(0, 100) : "",
        size: line?.size ? String(line.size).slice(0, 60) : "",
        priceCents: Math.max(0, Number(line?.priceCents) || 0),
    };
}
const sanitize = (arr) => (Array.isArray(arr) ? arr.filter((l) => l?.productId).slice(0, 200).map(clean) : []);

// GET /api/account/favorites — the buyer's wishlist (cross-device).
export async function GET(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: false, favorites: auth.customer.favorites ?? [] });
}

// PUT /api/account/favorites — replace the wishlist. Body: { favorites }
export async function PUT(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!Array.isArray(body?.favorites)) return NextResponse.json({ error: "favorites array required" }, { status: 400 });

    await StorefrontCustomer.updateOne({ _id: auth.customer._id, orgId: auth.orgId }, { $set: { favorites: sanitize(body.favorites) } });
    return NextResponse.json({ error: false });
}
