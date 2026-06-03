import { NextResponse } from "next/server";
import { listProducts, updateOffers } from "@/functions/channelEngine";

// GET /api/admin/channelengine/products?page=1&pageSize=50
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page") || "1";
        const pageSize = searchParams.get("pageSize") || "50";

        const result = await listProducts({ page, pageSize });
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        console.error("[channelengine/products GET]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

// PUT /api/admin/channelengine/products — update stock / price offers
// Body: [{ MerchantProductNo, Price, Stock }]
export async function PUT(req) {
    try {
        const offers = await req.json();
        if (!Array.isArray(offers) || offers.length === 0)
            return NextResponse.json({ error: true, msg: "offers must be a non-empty array" }, { status: 400 });

        const result = await updateOffers(offers);
        return NextResponse.json({ error: false, result });
    } catch (e) {
        console.error("[channelengine/products PUT]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
