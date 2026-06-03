import { NextResponse } from "next/server";
import { CESale } from "@pythias/mongo";
import { updateOffers, updateChannelOffers } from "@/functions/channelEngine";

// GET /api/admin/channelengine/sales?status=&page=1&pageSize=20
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const status   = searchParams.get("status") || "";
        const page     = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "20", 10));

        const query = status ? { status } : {};
        const [sales, total] = await Promise.all([
            CESale.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
            CESale.countDocuments(query),
        ]);
        return NextResponse.json({ error: false, sales, total });
    } catch (e) {
        console.error("[channelengine/sales GET]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

// POST /api/admin/channelengine/sales
// Body: { products: [{merchantProductNo, originalPrice, salePrice, name}], discountType, discountValue, startDate, endDate, notes }
export async function POST(req) {
    try {
        const body = await req.json();
        const { products, discountType, discountValue, startDate, endDate, notes, channels } = body;

        if (!products?.length) return NextResponse.json({ error: true, msg: "products is required" }, { status: 400 });

        const now   = new Date();
        const start = startDate ? new Date(startDate) : now;
        const end   = endDate   ? new Date(endDate)   : null;

        const isImmediate = start <= now;
        const status = isImmediate ? "active" : "scheduled";

        const sale = await CESale.create({
            status,
            discountType,
            discountValue,
            startDate: start,
            endDate:   end,
            products,
            channels:  channels ?? [],
            notes,
            activatedAt: isImmediate ? now : undefined,
        });

        // If starting immediately, push to CE now
        if (isImmediate) {
            const offers = products.map(p => ({
                MerchantProductNo: p.merchantProductNo,
                Price:             parseFloat(p.salePrice.toFixed(2)),
                ListPrice:         parseFloat(p.originalPrice.toFixed(2)),
            }));
            const selectedChannels = channels ?? [];
            if (selectedChannels.length > 0) {
                // Push to each selected channel individually
                await Promise.allSettled(selectedChannels.map(ch => updateChannelOffers(ch.id, offers)));
            } else {
                await updateOffers(offers);
            }
        }

        return NextResponse.json({ error: false, sale, activated: isImmediate });
    } catch (e) {
        console.error("[channelengine/sales POST]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
