import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformOrder, PlatformItem, PlatformBlank } from "@pythias/mongo";

const VALID_SORT_FIELDS = new Set(["date", "poNumber", "marketplace", "productCost"]);

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

        const filter = { orgId, date: { $gte: since, $lte: until }, cancelled: { $ne: true } };
        if (marketplace && marketplace !== "All") filter.marketplace = marketplace;

        const [orders, total] = await Promise.all([
            PlatformOrder.find(filter)
                .select("date poNumber orderId marketplace productCost shippingCost discountAmount status cancelled shippingInfo")
                .sort({ [sortField]: sortDir })
                .skip(csvMode ? 0 : (page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            csvMode ? Promise.resolve(0) : PlatformOrder.countDocuments(filter),
        ]);

        const orderIds = orders.map(o => o._id);
        const rawItems = await PlatformItem.find({ order: { $in: orderIds }, cancelled: { $ne: true } }).select("order styleCode sizeName price").lean();
        const itemsWithCogs = await addCogs(rawItems, orgId);

        const cogsByOrder = {};
        for (const i of itemsWithCogs) {
            const key = String(i.order);
            cogsByOrder[key] = (cogsByOrder[key] || 0) + (i.wholesaleCost || 0);
        }

        const enriched = orders.map(o => ({
            ...o,
            blanksCogs:  cogsByOrder[String(o._id)] || 0,
            shippingPaid: o.shippingCost ?? 0,
        }));

        if (csvMode) {
            const esc = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; };
            const headers = ["Date", "PO Number", "Order ID", "Marketplace", "Status", "Revenue", "Shipping Cost", "Blank COGS"];
            const rows = enriched.map(o => [
                o.date ? new Date(o.date).toLocaleDateString() : "",
                o.poNumber || "", o.orderId || "", o.marketplace || "Unknown",
                o.cancelled ? "Cancelled" : (o.status || ""),
                ((o.productCost ?? 0) + (o.shippingCost ?? 0) - (o.discountAmount ?? 0)).toFixed(2),
                (o.shippingPaid ?? 0).toFixed(2),
                (o.blanksCogs ?? 0).toFixed(2),
            ]);
            const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\r\n");
            return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="orders.csv"` } });
        }

        return NextResponse.json({ orders: enriched, total, page, pageSize, pages: Math.ceil(total / pageSize) });
    } catch (e) {
        console.error("[reports/orders]", e);
        return NextResponse.json({ error: true, msg: e.message, orders: [], total: 0, page: 1, pageSize: 50, pages: 0 }, { status: 500 });
    }
}
