import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Order } from "@pythias/mongo";
import { createWooProduct, updateWooProduct, getWooOrders } from "../functions/woocommerce.js";

export async function handleWooSendPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId ?? body.connection?._id);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const existingId = body.product?.ids?.[connection.displayName];
        const wooProduct = existingId
            ? await updateWooProduct(existingId, body.product, connection)
            : await createWooProduct(body.product, connection);

        const variations = wooProduct._createdVariations ?? [];
        return NextResponse.json({
            error: false,
            wooProductId: wooProduct.id,
            variantIds: variations.map(v => ({ sku: v.sku ?? "", id: String(v.id) })),
        });
    } catch (e) {
        console.error("[WooCommerce] send failed:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function handleWooOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: true, msg: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const data = await getWooOrders(connection, 1);
        return NextResponse.json({ orders: data.orders, count: data.orders.length });
    } catch (e) {
        console.error("[WooCommerce] orders fetch error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 502 });
    }
}

export async function handleWooOrdersPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    let page = 1;
    let imported = 0;

    while (true) {
        let data;
        try {
            data = await getWooOrders(connection, page);
        } catch (e) {
            console.error("[WooCommerce] orders pull error:", e.message);
            break;
        }

        const orders = data.orders;
        if (!orders.length) break;

        for (const wo of orders) {
            const existing = await Order.findOne({ marketplaceOrderId: String(wo.id) });
            if (existing) continue;

            const shipping = wo.shipping ?? {};
            const order = new Order({
                marketplaceOrderId: String(wo.id),
                poNumber: `WOO-${wo.number}`,
                status: "pending",
                date: new Date(wo.date_created ?? Date.now()),
                provider: connection.provider,
                marketplace: "WooCommerce",
                customer: {
                    name: `${wo.billing?.first_name ?? ""} ${wo.billing?.last_name ?? ""}`.trim(),
                    email: wo.billing?.email ?? "",
                    phone: wo.billing?.phone ?? "",
                },
                shippingInfo: {
                    address:  shipping.address_1 ?? "",
                    address2: shipping.address_2 ?? "",
                    city:     shipping.city ?? "",
                    state:    shipping.state ?? "",
                    zip:      shipping.postcode ?? "",
                    country:  shipping.country ?? "",
                },
                items: (wo.line_items ?? []).map(li => ({
                    sku:   li.sku ?? li.product_id ?? "",
                    qty:   li.quantity ?? 1,
                    price: parseFloat(li.price ?? 0),
                    name:  li.name ?? "",
                })),
                total: parseFloat(wo.total ?? 0),
            });

            try {
                await order.save();
                imported++;
            } catch (e) {
                console.log(`[WooCommerce] order ${wo.id} save failed:`, e.message);
            }
        }

        // WooCommerce returns up to per_page items; if fewer came back, we're done
        if (orders.length < 100) break;
        page++;
    }

    return NextResponse.json({ error: false, imported });
}
