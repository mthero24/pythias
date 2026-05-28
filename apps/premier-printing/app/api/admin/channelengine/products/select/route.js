import { NextResponse } from "next/server";
import { listProducts } from "@/functions/channelEngine";

// GET /api/admin/channelengine/products/select
// Returns all CE product nos + prices + names across pages (for bulk selection UI).
// Iterates CE pages internally. Capped at 2000 products.
export async function GET() {
    try {
        const PAGE_SIZE = 100;
        const MAX_PAGES = 20;
        const all = [];

        for (let page = 1; page <= MAX_PAGES; page++) {
            const res = await listProducts({ page, pageSize: PAGE_SIZE });
            const items = res?.Content ?? [];
            for (const p of items) {
                if (p.MerchantProductNo || p.Id) {
                    all.push({
                        MerchantProductNo: p.MerchantProductNo ?? p.Id,
                        Price: p.Price ?? 0,
                        Name:  p.Name  ?? "",
                    });
                }
            }
            if (items.length < PAGE_SIZE) break; // last page
        }

        return NextResponse.json({ error: false, products: all });
    } catch (e) {
        console.error("[channelengine/products/select GET]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
