import { NextResponse } from "next/server";
import Order from "@/models/Order";
import Items from "@/models/Items";
import StyleV2 from "@/models/StyleV2";
import { Design, LicenseHolders } from "@pythias/mongo";

const VALID_SORT_FIELDS = new Set(["date", "poNumber", "marketplace", "productCost"]);
const shipCostExpr = (o) => o.shippingInfo?.shippingCost ?? 0;

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
        const fromParam   = searchParams.get("from");
        const toParam     = searchParams.get("to");
        const marketplace = searchParams.get("marketplace");
        const csvMode     = searchParams.get("csv") === "1";
        const page        = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const pageSize    = csvMode ? 10000 : Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10)));
        const sortField   = VALID_SORT_FIELDS.has(searchParams.get("sort")) ? searchParams.get("sort") : "date";
        const sortDir     = searchParams.get("dir") === "asc" ? 1 : -1;

        const since = fromParam ? new Date(fromParam + "T00:00:00") : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const until = toParam   ? new Date(toParam   + "T23:59:59") : new Date();

        const filter = { date: { $gte: since, $lte: until }, status: { $nin: ["Canceled", "Payment Failed"] } };
        if (marketplace && marketplace !== "All") filter.marketplace = marketplace;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .select("date poNumber orderId marketplace productCost shippingCost discountAmount status selectedShipping canceled refunded shippingInfo")
                .sort({ [sortField]: sortDir })
                .skip(csvMode ? 0 : (page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            csvMode ? Promise.resolve(0) : Order.countDocuments(filter),
        ]);

        const orderIds  = orders.map(o => o._id);
        const rawItems  = await Items.find({ order: { $in: orderIds }, canceled: { $ne: true } }).select("order styleCode sizeName designRef price").lean();
        const itemsWithCogs = await addCogs(rawItems);
        const itemsEnriched = await addLicenceFees(itemsWithCogs);

        const cogsByOrder = {};
        const licenceFeeByOrder = {};
        for (const i of itemsEnriched) {
            const key = String(i.order);
            cogsByOrder[key] = (cogsByOrder[key] || 0) + (i.wholesaleCost || 0);
            licenceFeeByOrder[key] = (licenceFeeByOrder[key] || 0) + (i.licenceFee || 0);
        }

        const enriched = orders.map(o => ({ ...o, blanksCogs: cogsByOrder[String(o._id)] || 0, licenceFee: licenceFeeByOrder[String(o._id)] || 0, shippingPaid: shipCostExpr(o) }));

        if (csvMode) {
            const headers = ["Date", "PO Number", "Order ID", "Marketplace", "Status", "Revenue", "Shipping Cost", "Blank COGS", "Licence Fee"];
            const rows = enriched.map(o => [
                o.date ? new Date(o.date).toLocaleDateString() : "",
                o.poNumber || "", o.orderId || "", o.marketplace || "Unknown",
                o.canceled ? "Canceled" : o.refunded ? "Refunded" : (o.status || ""),
                ((o.productCost ?? 0) + (o.shippingCost ?? 0) - (o.discountAmount ?? 0)).toFixed(2), (o.shippingPaid ?? 0).toFixed(2), (o.blanksCogs ?? 0).toFixed(2), (o.licenceFee ?? 0).toFixed(2),
            ]);
            const escape = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; };
            const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\r\n");
            return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="orders.csv"` } });
        }

        return NextResponse.json({ orders: enriched, total, page, pageSize, pages: Math.ceil(total / pageSize) });
    } catch (e) {
        console.error("[dashboard/orders] error:", e);
        return NextResponse.json({ error: true, msg: e.message, orders: [], total: 0, page: 1, pageSize: 50, pages: 0 }, { status: 500 });
    }
}
