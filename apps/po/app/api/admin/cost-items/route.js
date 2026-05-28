import { NextResponse } from "next/server";
import Order from "@/models/Order";
import Items from "@/models/Items";
import StyleV2 from "@/models/StyleV2";
import { Design, LicenseHolders } from "@pythias/mongo";

const VALID_SORT_FIELDS = new Set(["date", "styleCode", "colorName", "sizeName", "price"]);

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
        const styles = styleCodes.length ? await StyleV2.find({ code: { $in: styleCodes } }).select("code sizes").lean() : [];
        const costMap = {};
        for (const s of styles) { costMap[s.code] = {}; for (const sz of s.sizes ?? []) costMap[s.code][sz.name] = sz.wholesaleCost ?? 0; }
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
