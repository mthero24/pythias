export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformEditData } from "@pythias/mongo";

// Commerce Cloud sellers don't have the Edit Data screen — print types are inherited from
// Premier. This endpoint lets them view and override the per-print-type pricing that gets
// added to each product's wholesale + retail at build time.

// GET /api/commerce/print-pricing — the seller's print types with current prices
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const printTypes = await PlatformEditData.find({ orgId, type: "printTypes" })
        .select("name price")
        .sort({ name: 1 })
        .lean();
    return NextResponse.json({ error: false, printTypes: printTypes.map(p => ({ _id: p._id.toString(), name: p.name, price: p.price ?? 0 })) });
}

// PUT /api/commerce/print-pricing — update prices. Body: { prices: { <printTypeId>: <dollars> } }
export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const body = await req.json().catch(() => null);
    const prices = body?.prices;
    if (!prices || typeof prices !== "object") return NextResponse.json({ error: "prices map is required" }, { status: 400 });

    let updated = 0;
    for (const [id, raw] of Object.entries(prices)) {
        const price = Number(raw);
        if (isNaN(price) || price < 0) continue;
        // Scope to this org so a seller can only edit their own print types.
        const res = await PlatformEditData.updateOne({ _id: id, orgId, type: "printTypes" }, { $set: { price } });
        if (res.matchedCount) updated++;
    }
    return NextResponse.json({ error: false, updated });
}
