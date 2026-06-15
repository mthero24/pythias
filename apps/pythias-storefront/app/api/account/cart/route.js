export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

// Keep only the fields we persist, and cap sizes so a client can't bloat the doc.
function clean(line) {
    return {
        productId: String(line?.productId ?? ""),
        sku: line?.sku ? String(line.sku) : "",
        qty: Math.max(1, Math.min(99, Number(line?.qty) || 1)),
        title: line?.title ? String(line.title).slice(0, 200) : "",
        image: line?.image ? String(line.image).slice(0, 600) : "",
        color: line?.color ? String(line.color).slice(0, 100) : "",
        size: line?.size ? String(line.size).slice(0, 60) : "",
        priceCents: Math.max(0, Number(line?.priceCents) || 0),
    };
}
const sanitize = (arr) => (Array.isArray(arr) ? arr.filter((l) => l?.productId).slice(0, 100).map(clean) : []);

// GET /api/account/cart — the buyer's saved cart + save-for-later (for cross-device restore).
export async function GET(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: false, cart: auth.customer.cart ?? [], savedForLater: auth.customer.savedForLater ?? [] });
}

// PUT /api/account/cart — replace the buyer's cart and/or save-for-later. Body: { cart?, savedForLater? }
export async function PUT(req) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const set = { cartUpdatedAt: new Date() };
    if (Array.isArray(body?.cart)) set.cart = sanitize(body.cart);
    if (Array.isArray(body?.savedForLater)) set.savedForLater = sanitize(body.savedForLater);

    await StorefrontCustomer.updateOne({ _id: auth.customer._id, orgId: auth.orgId }, { $set: set });
    return NextResponse.json({ error: false });
}
