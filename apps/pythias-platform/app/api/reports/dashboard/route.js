import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformOrder, PlatformItem, PlatformBlank } from "@pythias/mongo";

const activeExpr   = { $and: [{ $ne: ["$cancelled", true] }] };
const revenueExpr  = { $subtract: [{ $add: [{ $ifNull: ["$productCost", 0] }, { $ifNull: ["$shippingCost", 0] }] }, { $ifNull: ["$discountAmount", 0] }] };
const shipCostExpr = { $ifNull: ["$shippingCost", 0] };

async function addCogs(items, orgId) {
    if (!items.length) return items;
    const styleCodes = [...new Set(items.map(i => i.styleCode).filter(Boolean))];
    if (!styleCodes.length) return items.map(i => ({ ...i, wholesaleCost: 0 }));
    const blanks = await PlatformBlank.find({ orgId, code: { $in: styleCodes } }).select("code sizes").lean();
    const costMap = {};
    for (const b of blanks) { costMap[b.code] = {}; for (const sz of b.sizes ?? []) costMap[b.code][sz.name] = sz.wholesaleCost ?? 0; }
    return items.map(i => ({ ...i, wholesaleCost: costMap[i.styleCode]?.[i.sizeName] ?? 0 }));
}

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
        const orgId = session.user.orgId;

        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get("from");
        const toParam   = searchParams.get("to");

        const since = fromParam ? new Date(fromParam + "T00:00:00") : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const until = toParam   ? new Date(toParam   + "T23:59:59") : new Date();
        const dateFilter = { $gte: since, $lte: until };

        const [summaryAgg, byMarketplaceAgg, rawItems, itemCount, revenueByDayAgg, itemsByDayAgg] = await Promise.all([
            PlatformOrder.aggregate([
                { $match: { orgId, date: dateFilter } },
                { $group: {
                    _id:           null,
                    totalRevenue:  { $sum: { $cond: { if: activeExpr, then: revenueExpr, else: 0 } } },
                    orderCount:    { $sum: { $cond: { if: activeExpr, then: 1, else: 0 } } },
                    canceledCount: { $sum: { $cond: { if: activeExpr, then: 0, else: 1 } } },
                    totalShipping: { $sum: { $cond: { if: activeExpr, then: shipCostExpr, else: 0 } } },
                }},
            ]),
            PlatformOrder.aggregate([
                { $match: { orgId, date: dateFilter, cancelled: { $ne: true } } },
                { $group: { _id: { $ifNull: ["$marketplace", "Unknown"] }, orders: { $sum: 1 }, revenue: { $sum: revenueExpr }, shipping: { $sum: shipCostExpr } } },
                { $project: { _id: 0, marketplace: "$_id", orders: 1, revenue: 1, shipping: 1 } },
                { $sort: { revenue: -1 } },
            ]),
            PlatformItem.find({ orgId, date: dateFilter })
                .select("date status steps printed treated folded shipped cancelled repull colorName sizeName styleCode pieceId orderId poNumber order")
                .sort({ date: -1 }).limit(5000).lean(),
            PlatformItem.countDocuments({ orgId, date: dateFilter }),
            PlatformOrder.aggregate([
                { $match: { orgId, date: dateFilter, cancelled: { $ne: true } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, revenue: { $sum: revenueExpr }, orders: { $sum: 1 } } },
                { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
                { $sort: { date: 1 } },
            ]),
            PlatformItem.aggregate([
                { $match: { orgId, date: dateFilter, cancelled: { $ne: true } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
                { $project: { _id: 0, date: "$_id", count: 1 } },
                { $sort: { date: 1 } },
            ]),
        ]);

        const items = await addCogs(rawItems, orgId);

        const allOrderIds = [...new Set(rawItems.map(i => i.order).filter(Boolean))];
        const orderMpDocs = await PlatformOrder.find({ _id: { $in: allOrderIds } }).select("marketplace").lean();
        const orderMarketplaceMap = Object.fromEntries(orderMpDocs.map(o => [String(o._id), o.marketplace || "Unknown"]));

        const cogItemsAgg = await PlatformItem.aggregate([
            { $match: { orgId, date: dateFilter, cancelled: { $ne: true } } },
            { $group: { _id: { styleCode: "$styleCode", sizeName: "$sizeName", order: "$order" }, count: { $sum: 1 } } },
            { $project: { _id: 0, styleCode: "$_id.styleCode", sizeName: "$_id.sizeName", order: "$_id.order", count: 1 } },
        ]);
        const cogStyleCodes = [...new Set(cogItemsAgg.map(r => r.styleCode).filter(Boolean))];
        const cogBlanks = cogStyleCodes.length ? await PlatformBlank.find({ orgId, code: { $in: cogStyleCodes } }).select("code sizes").lean() : [];
        const cogCostMap = {};
        for (const b of cogBlanks) { cogCostMap[b.code] = {}; for (const sz of b.sizes ?? []) cogCostMap[b.code][sz.name] = sz.wholesaleCost ?? 0; }
        const cogOrderIds = [...new Set(cogItemsAgg.map(r => r.order).filter(Boolean).map(String))];
        const cogOrderDocs = cogOrderIds.length ? await PlatformOrder.find({ _id: { $in: cogOrderIds } }).select("marketplace").lean() : [];
        const cogOrderMpMap = Object.fromEntries(cogOrderDocs.map(o => [String(o._id), o.marketplace || "Unknown"]));

        const cogsByMarketplace = {};
        const itemCountByMarketplace = {};
        const itemsByMarketplaceAndStyle = {};
        for (const row of cogItemsAgg) {
            if (!row.order) continue;
            const unitCost = cogCostMap[row.styleCode]?.[row.sizeName] ?? 0;
            const mp = cogOrderMpMap[String(row.order)] || "Unknown";
            const style = row.styleCode || "Unknown";
            cogsByMarketplace[mp] = (cogsByMarketplace[mp] || 0) + unitCost * row.count;
            itemCountByMarketplace[mp] = (itemCountByMarketplace[mp] || 0) + row.count;
            if (!itemsByMarketplaceAndStyle[mp]) itemsByMarketplaceAndStyle[mp] = {};
            itemsByMarketplaceAndStyle[mp][style] = (itemsByMarketplaceAndStyle[mp][style] || 0) + row.count;
        }

        const summary       = summaryAgg[0] ?? { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 };
        const byMarketplace = byMarketplaceAgg;

        return NextResponse.json({
            summary, byMarketplace, orderMarketplaceMap, items, itemCount,
            revenueByDay: revenueByDayAgg, itemsByDay: itemsByDayAgg,
            cogsByMarketplace, itemCountByMarketplace, itemsByMarketplaceAndStyle,
        });
    } catch (e) {
        console.error("[reports/dashboard]", e);
        return NextResponse.json({ error: true, msg: e.message, summary: { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 }, byMarketplace: [], items: [] }, { status: 500 });
    }
}
