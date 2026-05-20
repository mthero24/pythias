import { NextResponse } from "next/server";
import { Order, Items, Inventory, addCogs } from "@pythias/mongo";

const activeExpr = { $and: [{ $ne: ["$canceled", true] }, { $ne: ["$refunded", true] }] };
const shipCostExpr = { $ifNull: ["$selectedShipping.cost", { $ifNull: ["$shippingInfo.shippingCost", 0] }] };

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
                    totalRevenue:  { $sum: { $cond: { if: activeExpr, then: { $ifNull: ["$total", 0] }, else: 0 } } },
                    orderCount:    { $sum: { $cond: { if: activeExpr, then: 1, else: 0 } } },
                    canceledCount: { $sum: { $cond: { if: activeExpr, then: 0, else: 1 } } },
                    totalShipping: { $sum: { $cond: { if: activeExpr, then: shipCostExpr, else: 0 } } },
                }},
            ]),
            Order.aggregate([
                { $match: { date: dateFilter, canceled: { $ne: true }, refunded: { $ne: true } } },
                { $group: {
                    _id:      { $ifNull: ["$marketplace", "Unknown"] },
                    orders:   { $sum: 1 },
                    revenue:  { $sum: { $ifNull: ["$total", 0] } },
                    shipping: { $sum: shipCostExpr },
                }},
                { $project: { _id: 0, marketplace: "$_id", orders: 1, revenue: 1, shipping: 1 } },
                { $sort: { revenue: -1 } },
            ]),
            Items.find({ date: dateFilter })
                .select("date status printed treated folded shipped canceled rePulled colorName sizeName styleCode batchID orderId poNumber order labelLastPrinted printedDate shippedDate")
                .sort({ date: -1 })
                .limit(5000)
                .lean(),
            Inventory.aggregate([
                { $match: { quantity: { $gt: 0 } } },
                { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$unit_cost"] } } } },
            ]),
            Items.countDocuments({ date: dateFilter }),
            Order.aggregate([
                { $match: { date: dateFilter, canceled: { $ne: true }, refunded: { $ne: true } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, revenue: { $sum: { $ifNull: ["$total", 0] } }, orders: { $sum: 1 } } },
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

        // Lightweight map: order _id → marketplace (only for orders that have items in this range)
        const itemOrderIds = [...new Set(rawItems.map(i => i.order).filter(Boolean))];
        const orderMpDocs  = await Order.find({ _id: { $in: itemOrderIds } }).select("marketplace").lean();
        const orderMarketplaceMap = Object.fromEntries(orderMpDocs.map(o => [String(o._id), o.marketplace || "Unknown"]));

        const summary        = summaryAgg[0] ?? { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 };
        const byMarketplace  = byMarketplaceAgg;
        const inventoryValue = invResult[0]?.totalValue ?? 0;

        console.log(`[dashboard] ${since.toISOString()} → ${until.toISOString()} | orders: ${summary.orderCount} | items: ${itemCount} (fetched: ${items.length})`);

        return NextResponse.json({ summary, byMarketplace, orderMarketplaceMap, items, inventoryValue, itemCount, revenueByDay: revenueByDayAgg, itemsByDay: itemsByDayAgg });
    } catch (e) {
        console.error("[dashboard] error:", e);
        return NextResponse.json({
            error: true, msg: e.message,
            summary: { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 },
            byMarketplace: [], orderMarketplaceMap: {}, items: [], inventoryValue: 0,
        }, { status: 500 });
    }
}
