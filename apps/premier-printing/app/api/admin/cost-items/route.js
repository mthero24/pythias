import { NextResponse } from "next/server";
import { Order, Items, Blank, addLicenceFees } from "@pythias/mongo";

const VALID_SORT_FIELDS = new Set(["date", "styleCode", "colorName", "sizeName", "price"]);

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get("from");
        const toParam   = searchParams.get("to");
        const page      = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const pageSize  = Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10)));
        const sortField = VALID_SORT_FIELDS.has(searchParams.get("sort")) ? searchParams.get("sort") : "date";
        const sortDir   = searchParams.get("dir") === "asc" ? 1 : -1;

        const since = fromParam ? new Date(fromParam + "T00:00:00") : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const until = toParam   ? new Date(toParam   + "T23:59:59") : new Date();
        const dateFilter = { $gte: since, $lte: until };

        const filter = { date: dateFilter, canceled: { $ne: true } };

        const [rawItems, total] = await Promise.all([
            Items.find(filter)
                .select("date styleCode sizeName colorName price designRef orderId poNumber order")
                .sort({ [sortField]: sortDir })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            Items.countDocuments(filter),
        ]);

        const styleCodes = [...new Set(rawItems.map(i => i.styleCode).filter(Boolean))];
        const blanks = styleCodes.length ? await Blank.find({ code: { $in: styleCodes } }).select("code sizes").lean() : [];
        const costMap = {};
        for (const b of blanks) { costMap[b.code] = {}; for (const s of b.sizes ?? []) costMap[b.code][s.name] = s.wholesaleCost ?? 0; }
        const itemsWithCogs = rawItems.map(i => ({ ...i, wholesaleCost: costMap[i.styleCode]?.[i.sizeName] ?? 0 }));

        const orderIds = [...new Set(rawItems.map(i => i.order).filter(Boolean).map(String))];
        const orderDocs = orderIds.length ? await Order.find({ _id: { $in: orderIds } }).select("marketplace").lean() : [];
        const orderMpMap = Object.fromEntries(orderDocs.map(o => [String(o._id), o.marketplace || "Unknown"]));

        const itemsWithFees = await addLicenceFees(itemsWithCogs);
        const items = itemsWithFees.map(i => ({
            ...i,
            marketplace: i.order ? (orderMpMap[String(i.order)] || "Unknown") : "Unknown",
        }));

        return NextResponse.json({ items, total, page, pageSize, pages: Math.ceil(total / pageSize) });
    } catch (e) {
        console.error("[cost-items] error:", e);
        return NextResponse.json({ error: true, msg: e.message, items: [], total: 0, page: 1, pageSize: 50, pages: 0 }, { status: 500 });
    }
}
