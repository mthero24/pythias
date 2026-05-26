import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Order } from "@pythias/mongo";
import { getWayfairOrders, acceptWayfairOrder } from "../functions/wayfair.js";

export async function handleWayfairOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: true, msg: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const data = await getWayfairOrders(connection);
        return NextResponse.json({ orders: data.orders, count: data.orders.length });
    } catch (e) {
        console.error("[Wayfair] orders fetch error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 502 });
    }
}

export async function handleWayfairOrdersPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    let cursor = null;
    let imported = 0;

    do {
        let data;
        try {
            data = await getWayfairOrders(connection, cursor);
        } catch (e) {
            console.error("[Wayfair] orders pull error:", e.message);
            break;
        }

        if (!data.orders.length) break;

        for (const wo of data.orders) {
            const existing = await Order.findOne({ marketplaceOrderId: wo.poNumber });
            if (existing) continue;

            const addr = wo.shippingAddress ?? {};

            // Accept the PO before saving
            try {
                await acceptWayfairOrder(wo.poNumber, wo.lineItems ?? [], connection);
            } catch (e) {
                console.warn(`[Wayfair] accept PO ${wo.poNumber} failed:`, e.message);
            }

            const order = new Order({
                marketplaceOrderId: wo.poNumber,
                poNumber: `WF-${wo.poNumber}`,
                status: "pending",
                date: wo.poDate ? new Date(wo.poDate) : new Date(),
                provider: connection.provider,
                marketplace: "Wayfair",
                customer: {
                    name: wo.customerName ?? "",
                    email: wo.customerEmail ?? "",
                    phone: wo.customerPhone ?? "",
                },
                shippingInfo: {
                    address: addr.address1 ?? "",
                    address2: addr.address2 ?? "",
                    city: addr.city ?? "",
                    state: addr.state ?? "",
                    zip: addr.postalCode ?? "",
                    country: addr.country ?? "US",
                },
                items: (wo.lineItems ?? []).map(li => ({
                    sku: li.partNumber ?? "",
                    qty: li.quantity ?? 1,
                    price: parseFloat(li.unitPrice ?? 0),
                    name: li.partNumber ?? "",
                })),
                total: (wo.lineItems ?? []).reduce((sum, li) => sum + (li.quantity ?? 1) * parseFloat(li.unitPrice ?? 0), 0),
            });

            try {
                await order.save();
                imported++;
            } catch (e) {
                console.log(`[Wayfair] PO ${wo.poNumber} save failed:`, e.message);
            }
        }

        cursor = data.pageInfo?.hasNextPage ? data.pageInfo.endCursor : null;
    } while (cursor);

    return NextResponse.json({ error: false, imported });
}
