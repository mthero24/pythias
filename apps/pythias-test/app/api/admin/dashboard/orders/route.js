import { NextResponse } from "next/server";
import { Order, Items, addCogs } from "@pythias/mongo";

const VALID_SORT_FIELDS = new Set(["date", "poNumber", "marketplace", "total"]);

const shipCostExpr = (o) =>
    o.selectedShipping?.cost ?? o.shippingInfo?.shippingCost ?? 0;

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

        const filter = { date: { $gte: since, $lte: until } };
        if (marketplace && marketplace !== "All") filter.marketplace = marketplace;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .select("date poNumber orderId marketplace total status selectedShipping canceled refunded shippingInfo")
                .sort({ [sortField]: sortDir })
                .skip(csvMode ? 0 : (page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            csvMode ? Promise.resolve(0) : Order.countDocuments(filter),
        ]);

        const orderIds  = orders.map(o => o._id);
        const rawItems  = await Items.find({ order: { $in: orderIds }, canceled: { $ne: true } })
            .select("order styleCode sizeName").lean();
        const itemsWithCogs = await addCogs(rawItems);

        const cogsByOrder = {};
        for (const i of itemsWithCogs) {
            const key = String(i.order);
            cogsByOrder[key] = (cogsByOrder[key] || 0) + (i.wholesaleCost || 0);
        }

        const enriched = orders.map(o => ({
            ...o,
            blanksCogs: cogsByOrder[String(o._id)] || 0,
            shippingCost: shipCostExpr(o),
        }));

        if (csvMode) {
            const headers = ["Date", "PO Number", "Order ID", "Marketplace", "Status", "Revenue", "Shipping Cost", "Blank COGS"];
            const rows = enriched.map(o => [
                o.date ? new Date(o.date).toLocaleDateString() : "",
                o.poNumber || "",
                o.orderId  || "",
                o.marketplace || "Unknown",
                o.canceled ? "Canceled" : o.refunded ? "Refunded" : (o.status || ""),
                (o.total ?? 0).toFixed(2),
                (o.shippingCost ?? 0).toFixed(2),
                (o.blanksCogs ?? 0).toFixed(2),
            ]);
            const escape = (v) => {
                const s = String(v ?? "");
                return s.includes(",") || s.includes('"') || s.includes("\n")
                    ? `"${s.replace(/"/g, '""')}"` : s;
            };
            const csv = [headers, ...rows].map(r => r.map(escape).join(",")).join("\r\n");
            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="orders.csv"`,
                },
            });
        }

        return NextResponse.json({
            orders: enriched,
            total,
            page,
            pageSize,
            pages: Math.ceil(total / pageSize),
        });
    } catch (e) {
        console.error("[dashboard/orders] error:", e);
        return NextResponse.json({ error: true, msg: e.message, orders: [], total: 0, page: 1, pageSize: 50, pages: 0 }, { status: 500 });
    }
}
