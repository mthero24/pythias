import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Order } from "@pythias/mongo";
import { getMetaOrders, acknowledgeMetaOrders, createMetaProduct, updateMetaProduct } from "../functions/meta.js";

export async function handleMetaSendPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId ?? body.connection?._id);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const existingId = body.product?.ids?.[connection.displayName];
        let result;
        if (existingId) {
            result = await updateMetaProduct(existingId, body.product, connection);
            return NextResponse.json({ error: false, metaProductId: result.id });
        } else {
            result = await createMetaProduct(body.product, connection);
            return NextResponse.json({ error: false, metaProductId: result.catalogId, batchHandles: result.handles });
        }
    } catch (e) {
        console.error("[Meta] send failed:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function handleMetaOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: true, msg: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const data = await getMetaOrders(connection);
        return NextResponse.json({ orders: data.data ?? [], count: data.data?.length ?? 0 });
    } catch (e) {
        console.error("[Meta] orders fetch error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 502 });
    }
}

export async function handleMetaOrdersPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    let cursor = null;
    let imported = 0;

    do {
        let data;
        try {
            data = await getMetaOrders(connection, cursor);
        } catch (e) {
            console.error("[Meta] orders pull error:", e.message);
            break;
        }

        const orders = data.data ?? [];
        if (orders.length === 0) break;

        // Acknowledge batch before processing
        const orderIds = orders.map(o => o.id);
        try {
            await acknowledgeMetaOrders(orderIds, connection);
        } catch (e) {
            console.warn("[Meta] acknowledge failed:", e.message);
        }

        for (const mo of orders) {
            const existing = await Order.findOne({ marketplaceOrderId: mo.id });
            if (existing) continue;

            const addr = mo.ship_to ?? {};
            const buyer = mo.buyer_details ?? {};

            const order = new Order({
                marketplaceOrderId: mo.id,
                poNumber: `META-${mo.id}`,
                status: "pending",
                date: mo.created ? new Date(mo.created * 1000) : new Date(),
                provider: connection.provider,
                marketplace: "Meta Shops",
                customer: {
                    name: buyer.name ?? "",
                    email: buyer.email ?? "",
                    phone: "",
                },
                shippingInfo: {
                    address: addr.street1 ?? "",
                    address2: addr.street2 ?? "",
                    city: addr.city ?? "",
                    state: addr.state ?? "",
                    zip: addr.postal_code ?? "",
                    country: addr.country ?? "",
                },
                items: (mo.line_items?.data ?? []).map(li => ({
                    sku: li.retailer_id ?? "",
                    qty: li.quantity ?? 1,
                    price: parseFloat(li.price_per_unit?.amount ?? 0),
                    name: li.name ?? "",
                })),
                total: parseFloat(mo.order_total_amount?.amount ?? 0),
            });

            try {
                await order.save();
                imported++;
            } catch (e) {
                console.log(`[Meta] order ${mo.id} save failed:`, e.message);
            }
        }

        cursor = data.paging?.cursors?.after ?? null;
        if (!data.paging?.next) break;
    } while (cursor);

    return NextResponse.json({ error: false, imported });
}
