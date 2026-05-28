import { NextResponse } from "next/server";
import Order from "@/models/Order";
import Items from "@/models/Items";
import Inventory from "@/models/inventory";
import StyleV2 from "@/models/StyleV2";
import { Design, LicenseHolders, ServiceInvoicePo, KlingInvoicePo } from "@pythias/mongo";

const activeExpr   = { $and: [{ $ne: ["$canceled", true] }, { $ne: ["$refunded", true] }] };
const shipCostExpr = { $ifNull: ["$shippingInfo.shippingCost", 0] };
const revenueExpr  = { $subtract: [{ $add: [{ $ifNull: ["$productCost", 0] }, { $ifNull: ["$shippingCost", 0] }] }, { $ifNull: ["$discountAmount", 0] }] };

async function addCogs(items) {
    if (!items.length) return items;
    const styleCodes = [...new Set(items.map(i => i.styleCode).filter(Boolean))];
    if (!styleCodes.length) return items.map(i => ({ ...i, wholesaleCost: 0 }));
    const styles = await StyleV2.find({ code: { $in: styleCodes } }).select("code sizes").lean();
    const costMap = {};
    for (const s of styles) { costMap[s.code] = {}; for (const sz of s.sizes ?? []) costMap[s.code][sz.name] = sz.wholesaleCost ?? 0; }
    return items.map(i => ({ ...i, wholesaleCost: costMap[i.styleCode]?.[i.sizeName] ?? 0 }));
}

async function addLicenceFees(items) {
    if (!items.length) return items.map(i => ({ ...i, licenceFee: 0 }));
    const designIds = [...new Set(items.map(i => i.designRef).filter(Boolean).map(String))];
    if (!designIds.length) return items.map(i => ({ ...i, licenceFee: 0 }));
    const designs = await Design.find({ _id: { $in: designIds }, licenseHolder: { $ne: null } }).select("_id licenseHolder").lean();
    if (!designs.length) return items.map(i => ({ ...i, licenceFee: 0 }));
    const holderIds = [...new Set(designs.map(d => d.licenseHolder).filter(Boolean).map(String))];
    const holders = await LicenseHolders.find({ _id: { $in: holderIds } }).lean();
    const holderMap = Object.fromEntries(holders.map(h => [String(h._id), h]));
    const designHolderMap = {};
    for (const d of designs) { if (d.licenseHolder) designHolderMap[String(d._id)] = holderMap[String(d.licenseHolder)]; }
    const styleCodes = [...new Set(items.map(i => i.styleCode).filter(Boolean))];
    const styles = styleCodes.length ? await StyleV2.find({ code: { $in: styleCodes } }).select("code sizes").lean() : [];
    const retailMap = {};
    for (const s of styles) { retailMap[s.code] = {}; for (const sz of s.sizes ?? []) retailMap[s.code][sz.name] = sz.retailPrice ?? 0; }
    return items.map(i => {
        const holder = i.designRef ? designHolderMap[String(i.designRef)] : null;
        if (!holder) return { ...i, licenceFee: 0 };
        const basePrice = i.price || retailMap[i.styleCode]?.[i.sizeName] || 0;
        const adjPrice = basePrice + (holder.additionalFees || 0);
        const fee = adjPrice * (holder.paymentType === "Percentage Per Unit" ? (holder.amount / 100) : 1)
            + (holder.paymentType === "Flat Per Unit" || holder.paymentType === "One Time" ? holder.amount : 0);
        return { ...i, licenceFee: fee || 0 };
    });
}

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
                    totalRevenue:  { $sum: { $cond: { if: activeExpr, then: revenueExpr, else: 0 } } },
                    orderCount:    { $sum: { $cond: { if: activeExpr, then: 1, else: 0 } } },
                    canceledCount: { $sum: { $cond: { if: activeExpr, then: 0, else: 1 } } },
                    totalShipping: { $sum: { $cond: { if: activeExpr, then: shipCostExpr, else: 0 } } },
                }},
            ]),
            Order.aggregate([
                { $match: { date: dateFilter, canceled: { $ne: true }, refunded: { $ne: true } } },
                { $group: { _id: { $ifNull: ["$marketplace", "Unknown"] }, orders: { $sum: 1 }, revenue: { $sum: revenueExpr }, shipping: { $sum: shipCostExpr } } },
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
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, revenue: { $sum: revenueExpr }, orders: { $sum: 1 } } },
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

        // Compute cogsByMarketplace from ALL items in range (no 5000 cap)
        const cogItemsAgg = await Items.aggregate([
            { $match: { date: dateFilter, canceled: { $ne: true } } },
            { $group: { _id: { styleCode: "$styleCode", sizeName: "$sizeName", order: "$order" }, count: { $sum: 1 } } },
            { $project: { _id: 0, styleCode: "$_id.styleCode", sizeName: "$_id.sizeName", order: "$_id.order", count: 1 } },
        ]);
        const cogStyleCodes = [...new Set(cogItemsAgg.map(r => r.styleCode).filter(Boolean))];
        const cogStyles = cogStyleCodes.length ? await StyleV2.find({ code: { $in: cogStyleCodes } }).select("code sizes").lean() : [];
        const cogCostMap = {};
        for (const s of cogStyles) { cogCostMap[s.code] = {}; for (const sz of s.sizes ?? []) cogCostMap[s.code][sz.name] = sz.wholesaleCost ?? 0; }
        const cogOrderIds = [...new Set(cogItemsAgg.map(r => r.order).filter(Boolean).map(String))];
        const cogOrderDocs = cogOrderIds.length ? await Order.find({ _id: { $in: cogOrderIds } }).select("marketplace").lean() : [];
        const cogOrderMpMap = Object.fromEntries(cogOrderDocs.map(o => [String(o._id), o.marketplace || "Unknown"]));
        const cogsByMarketplace = {};
        for (const row of cogItemsAgg) {
            if (!row.order) continue;
            const unitCost = cogCostMap[row.styleCode]?.[row.sizeName] ?? 0;
            const mp = cogOrderMpMap[String(row.order)] || "Unknown";
            cogsByMarketplace[mp] = (cogsByMarketplace[mp] || 0) + unitCost * row.count;
        }

        const summary        = summaryAgg[0] ?? { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 };
        const byMarketplace  = byMarketplaceAgg;
        const inventoryValue = invResult[0]?.totalValue ?? 0;

        const sinceYear = since.getFullYear(), untilYear = until.getFullYear();
        const [serviceInvoicesForPeriod, klingInvoicesForPeriod] = await Promise.all([
            ServiceInvoicePo.find({ year: { $gte: sinceYear, $lte: untilYear } }).lean(),
            KlingInvoicePo.find({ year: { $gte: sinceYear, $lte: untilYear } }).lean(),
        ]);
        const inPeriod = inv => {
            const invDate = new Date(inv.year, inv.month - 1, 1);
            return invDate >= new Date(since.getFullYear(), since.getMonth(), 1) && invDate <= new Date(until.getFullYear(), until.getMonth(), 1);
        };
        const totalServiceCost = serviceInvoicesForPeriod.filter(inPeriod).reduce((s, i) => s + (i.totalAmount || 0), 0);
        const totalKlingCost   = klingInvoicesForPeriod.filter(inPeriod).reduce((s, i) => s + (i.totalAmount || 0), 0);

        return NextResponse.json({ summary, byMarketplace, orderMarketplaceMap, items, inventoryValue, itemCount, revenueByDay: revenueByDayAgg, itemsByDay: itemsByDayAgg, licenceFeeByMarketplace, totalServiceCost, totalKlingCost, cogsByMarketplace });
    } catch (e) {
        console.error("[dashboard] error:", e);
        return NextResponse.json({ error: true, msg: e.message, summary: { totalRevenue: 0, orderCount: 0, canceledCount: 0, totalShipping: 0 }, byMarketplace: [], orderMarketplaceMap: {}, items: [], inventoryValue: 0 }, { status: 500 });
    }
}
