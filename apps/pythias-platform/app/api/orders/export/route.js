import { NextResponse } from "next/server";
import { PlatformOrder } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

// GET /api/orders/export?status=awaiting_shipment
// CSV export of this org's orders (for a self-fulfilling seller's 3PL / ERP / spreadsheet).
// status: a specific order status, or "all". Defaults to awaiting_shipment (the open queue).

const csvCell = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const ymd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const orgId = token.orgId;

    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "awaiting_shipment").trim();
    const filter = { orgId };
    if (status && status !== "all") filter.status = status;

    const orders = await PlatformOrder.find(filter)
        .sort({ _id: -1 })
        .limit(5000)
        .populate("items", "sku name colorName sizeName quantity")
        .lean();

    const headers = [
        "Order ID", "PO Number", "Status", "Order Date", "Ship By", "Customer Email",
        "Ship To Name", "Address 1", "Address 2", "City", "State", "Zip", "Country",
        "Items", "Item Count", "Total", "Product Cost", "Shipping Cost", "Tracking",
    ];

    const rows = orders.map((o) => {
        const a = o.shippingAddress || {};
        const items = (o.items || []).map((i) => {
            const variant = [i.colorName, i.sizeName].filter(Boolean).join("/");
            return `${i.sku || i.name || "item"}${variant ? ` (${variant})` : ""} x${i.quantity || 1}`;
        });
        const itemCount = (o.items || []).reduce((n, i) => n + (parseInt(i.quantity) || 1), 0);
        const tracking = Array.isArray(o.trackingInfo?.labels)
            ? o.trackingInfo.labels.map((l) => l.trackingNumber).filter(Boolean).join(" ")
            : Array.isArray(o.trackingInfo) ? o.trackingInfo.filter(Boolean).join(" ") : "";
        return [
            o.orderId, o.poNumber, o.status, ymd(o.date), ymd(o.shipByDate), o.customerEmail,
            a.name, a.address1, a.address2, a.city, a.state, a.zip, a.country,
            items.join("; "), itemCount, o.total ?? 0, o.productCost ?? 0, o.shippingCost ?? 0, tracking,
        ];
    });

    const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const fname = `orders-${status}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${fname}"`,
            "Cache-Control": "no-store",
        },
    });
}
