import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Order } from "@pythias/mongo";
import { getOnBuyOrders, createOnBuyListing, updateOnBuyListing } from "../functions/onbuy.js";

export async function handleOnBuySendPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId ?? body.connection?._id);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const existingId = body.product?.ids?.[connection.displayName];
        let result;
        if (existingId) {
            result = await updateOnBuyListing(existingId, body.product, connection);
            return NextResponse.json({ error: false, onbuyListingId: result.id });
        } else {
            result = await createOnBuyListing(body.product, connection);
            const firstId = result.listings?.[0]?.listing_id ?? result.listings?.[0]?.id ?? null;
            return NextResponse.json({ error: false, onbuyListingId: firstId });
        }
    } catch (e) {
        console.error("[OnBuy] send failed:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function handleOnBuyOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: true, msg: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const data = await getOnBuyOrders(connection, 0);
        return NextResponse.json({ orders: data.orders, count: data.orders.length });
    } catch (e) {
        console.error("[OnBuy] orders fetch error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 502 });
    }
}

export async function handleOnBuyOrdersPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    let offset = 0;
    let imported = 0;

    do {
        let data;
        try {
            data = await getOnBuyOrders(connection, offset);
        } catch (e) {
            console.error("[OnBuy] orders pull error:", e.message);
            break;
        }

        if (!data.orders.length) break;

        for (const oo of data.orders) {
            const existing = await Order.findOne({ marketplaceOrderId: String(oo.order_id) });
            if (existing) continue;

            const addr = oo.delivery_address ?? {};

            const order = new Order({
                marketplaceOrderId: String(oo.order_id),
                poNumber: `ONBUY-${oo.order_id}`,
                status: "pending",
                date: oo.created ? new Date(oo.created) : new Date(),
                provider: connection.provider,
                marketplace: "OnBuy",
                customer: {
                    name: oo.buyer_name ?? "",
                    email: oo.buyer_email ?? "",
                    phone: "",
                },
                shippingInfo: {
                    address: addr.address_line_1 ?? addr.line1 ?? "",
                    address2: addr.address_line_2 ?? addr.line2 ?? "",
                    city: addr.city ?? addr.town ?? "",
                    state: addr.county ?? "",
                    zip: addr.postal_code ?? addr.postcode ?? "",
                    country: addr.country_code ?? addr.country ?? "GB",
                },
                items: (oo.lines ?? oo.line_items ?? []).map(li => ({
                    sku: li.sku ?? "",
                    qty: li.quantity ?? 1,
                    price: parseFloat(li.price ?? li.sale_price ?? 0),
                    name: li.name ?? "",
                })),
                total: parseFloat(oo.total ?? 0),
            });

            try {
                await order.save();
                imported++;
            } catch (e) {
                console.log(`[OnBuy] order ${oo.order_id} save failed:`, e.message);
            }
        }

        offset += data.orders.length;
        if (data.orders.length < 100) break;
    } while (true);

    return NextResponse.json({ error: false, imported });
}
