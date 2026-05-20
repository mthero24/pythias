import { NextResponse } from "next/server";
import Order from "@/models/Order";
import Items from "@/models/Items";
import Inventory from "@/models/inventory";
import StyleV2 from "@/models/StyleV2";

const activeExpr = { $and: [{ $ne: ["$canceled", true] }, { $ne: ["$refunded", true] }] };
const shipCostExpr = { $ifNull: ["$selectedShipping.cost", { $ifNull: ["$shippingInfo.shippingCost", 0] }] };

async function addCogs(items) {
    if (!items.length) return items;
    const styleCodes = [...new Set(items.map(i => i.styleCode).filter(Boolean))];
    if (!styleCodes.length) return items.map(i => ({ ...i, wholesaleCost: 0 }));
    const styles = await StyleV2.find({ code: { $in: styleCodes } }).select("code sizes").lean();
    const costMap = {};
    for (const s of styles) { costMap[s.code] = {}; for (const sz of s.sizes ?? []) costMap[s.code][sz.name] = sz.wholesaleCost ?? 0; }
    return items.map(i => ({ ...i, wholesaleCost: costMap[i.styleCode]?.[i.sizeName] ?? 0 }));
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get("from");
        const toParam   = searchParams.get("to");

        const since = fromParam ? new Date(fromParam + "T00:00:00") : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const until = toParam   ? new Date(toParam   + "T23:59:59") : new Date();
        const dateFilter = { $gte: since, $lte: until };

        const [summaryAgg, byMarketplaceAgg, rawItems, invResult, itemCount, revenueByDayAgg, itemsByDayAgg] = await Promise.all([
            Order.aggregate([
                { $match: { date: dateFilter } },
                { $group: {
                    _id:           null,
                    totalRevenue:  { $sum: { $cond: { if: activeExpr, then: { $ifNull: ["$productCost", 0] }, else: 0 } } },
                    orderCount:    { $sum: { $cond: { if: activeExpr, then: 1, else: 0 } } },
                    canceledCount: { $sum: { $cond: { if: activeExpr, then: 0, else: 1 } } },
                    totalShipping: { $sum: { $cond: { if: activeExpr, then: shipCostExpr, else: 0 } } },
                }},
            ]),
            Order.aggregate([
                { $match: { date: dateFilter, canceled: { $ne: true }, refunded: { $ne: true } } },
                { $group: { _id: { $ifNull: ["$marketplace", "Unknown"] }, orders: { $sum: 1 }, revenue: { $sum: { $ifNull: ["$productCost", 0] } }, shipping: { $sum: shipCostExpr } } },
                { $project: { _id: 0, marketplace: "$_id", orders: 1, revenue: 1, shipping: 1 } },
                { $sort: { revenue: -1 } },
            ]),
            Items.find({ date: dateFilter })
                .select("date status printed treated folded shipped canceled rePulled colorName sizeName styleCode batchID orderId poNumber order printedDate shippedDate")
                .sort({ date: -1 }).limit(5000).lean(),
            Inventory.aggregate([
                { $match: { quantity: { $gt: 0 } } },
                { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$unit_cost"] } } } },
            ]),
            Items.countDocuments({ date: dateFilter }),
            Order.aggregate([
                { $match: { date: dateFilter, canceled: { $ne: true }, refunded: { $ne: true } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, revenue: { $sum: { $ifNull: ["$productCost", 0] } }, orders: { $sum: 1 } } },
                { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
                { $sort: { date: 1 } },
            ]),
            Items.aggregate([
                { $match: { date: dateFilter, canceled: { $ne: true } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
                { $project: { _id: 0, date: "$_id", count: 1 } },
                { $sort: { date: 1 } },
            ]),
        ]);

        const items = await addCogs(rawItems);

        const itemOrderIds = [...new Set(rawItems.map(i => i.order).filter(Boolean))];
        const orderMpDocs  = await Order.find({ _id: { $in: itemOrderIds } }).select("marketplace").lean();
        const orderMarketplaceMap = Object.fromEntries(orderMpDocs.map(o => [String(o._id), o.marketplace || "Unknown"]));

        const summary        = summaryAgg[0] ?? { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 };
        const byMarketplace  = byMarketplaceAgg;
        const inventoryValue = invResult[0]?.totalValue ?? 0;

        return NextResponse.json({ summary, byMarketplace, orderMarketplaceMap, items, inventoryValue, itemCount, revenueByDay: revenueByDayAgg, itemsByDay: itemsByDayAgg });
    } catch (e) {
        console.error("[dashboard] error:", e);
        return NextResponse.json({ error: true, msg: e.message, summary: { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 }, byMarketplace: [], orderMarketplaceMap: {}, items: [], inventoryValue: 0 }, { status: 500 });
    }
}
