import { NextResponse } from "next/server";
import { PlatformOrder as Order, PlatformItem as Items, PlatformInventory as Inventory, PlatformBlank as Blank, addCogs, addLicenceFees, ServiceInvoicePremier, KlingInvoicePremier } from "@pythias/mongo";


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

        const [summaryAgg, byMarketplaceAgg, rawItems, invResult, itemCount, revenueByDayAgg, itemsByDayAgg, rawLicencedItems] = await Promise.all([
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
            // All licensed items in range — no cap — only fields needed for fee calculation
            Items.find({ date: dateFilter, designRef: { $ne: null }, canceled: { $ne: true } })
                .select("designRef price styleCode sizeName order")
                .lean(),
        ]);

        const items = await addCogs(rawItems);

        // Build order→marketplace map covering both regular items and licensed items
        const allOrderIds = [...new Set([
            ...rawItems.map(i => i.order),
            ...rawLicencedItems.map(i => i.order),
        ].filter(Boolean))];
        const orderMpDocs  = await Order.find({ _id: { $in: allOrderIds } }).select("marketplace").lean();
        const orderMarketplaceMap = Object.fromEntries(orderMpDocs.map(o => [String(o._id), o.marketplace || "Unknown"]));

        // Compute licence fees across ALL licensed items (no 5000 cap)
        const licencedItemsWithFees = await addLicenceFees(rawLicencedItems);
        const licenceFeeByMarketplace = {};
        for (const i of licencedItemsWithFees) {
            if (!i.order) continue;
            const mp = orderMarketplaceMap[String(i.order)] || "Unknown";
            licenceFeeByMarketplace[mp] = (licenceFeeByMarketplace[mp] || 0) + (i.licenceFee || 0);
        }

        const summary        = summaryAgg[0] ?? { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 };
        const byMarketplace  = byMarketplaceAgg;
        const inventoryValue = invResult[0]?.totalValue ?? 0;

        // Compute cogsByMarketplace from ALL items in range (no 5000 cap)
        const cogItemsAgg = await Items.aggregate([
            { $match: { date: dateFilter, canceled: { $ne: true } } },
            { $group: { _id: { styleCode: "$styleCode", sizeName: "$sizeName", order: "$order" }, count: { $sum: 1 } } },
            { $project: { _id: 0, styleCode: "$_id.styleCode", sizeName: "$_id.sizeName", order: "$_id.order", count: 1 } },
        ]);
        const cogStyleCodes = [...new Set(cogItemsAgg.map(r => r.styleCode).filter(Boolean))];
        const cogBlanks = cogStyleCodes.length ? await Blank.find({ code: { $in: cogStyleCodes } }).select("code sizes").lean() : [];
        const cogCostMap = {};
        for (const b of cogBlanks) { cogCostMap[b.code] = {}; for (const s of b.sizes ?? []) cogCostMap[b.code][s.name] = s.wholesaleCost ?? 0; }
        const cogOrderIds = [...new Set(cogItemsAgg.map(r => r.order).filter(Boolean).map(String))];
        const cogOrderDocs = cogOrderIds.length ? await Order.find({ _id: { $in: cogOrderIds } }).select("marketplace").lean() : [];
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

        // Service and Kling invoice costs for the period
        const sinceYear = since.getFullYear(), untilYear = until.getFullYear();
        const [serviceInvoicesForPeriod, klingInvoicesForPeriod] = await Promise.all([
            ServiceInvoicePremier.find({ year: { $gte: sinceYear, $lte: untilYear } }).lean(),
            KlingInvoicePremier.find({ year: { $gte: sinceYear, $lte: untilYear } }).lean(),
        ]);
        const inPeriod = inv => {
            const invDate = new Date(inv.year, inv.month - 1, 1);
            return invDate >= new Date(since.getFullYear(), since.getMonth(), 1) && invDate <= new Date(until.getFullYear(), until.getMonth(), 1);
        };
        const totalServiceCost = serviceInvoicesForPeriod.filter(inPeriod).reduce((s, i) => s + (i.totalAmount || 0), 0);
        const totalKlingCost   = klingInvoicesForPeriod.filter(inPeriod).reduce((s, i) => s + (i.totalAmount || 0), 0);

        console.log(`[dashboard] ${since.toISOString()} → ${until.toISOString()} | orders: ${summary.orderCount} | items: ${itemCount} (fetched: ${items.length})`);

        return NextResponse.json({ summary, byMarketplace, orderMarketplaceMap, items, inventoryValue, itemCount, revenueByDay: revenueByDayAgg, itemsByDay: itemsByDayAgg, licenceFeeByMarketplace, totalServiceCost, totalKlingCost, cogsByMarketplace, itemCountByMarketplace, itemsByMarketplaceAndStyle });
    } catch (e) {
        console.error("[dashboard] error:", e);
        return NextResponse.json({
            error: true, msg: e.message,
            summary: { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 },
            byMarketplace: [], orderMarketplaceMap: {}, items: [], inventoryValue: 0,
        }, { status: 500 });
    }
}
