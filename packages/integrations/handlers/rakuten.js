import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Order } from "@pythias/mongo";
import { getRakutenOrders, createRakutenItem, updateRakutenItem } from "../functions/rakuten.js";

export async function handleRakutenSendPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId ?? body.connection?._id);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const existingId = body.product?.ids?.[connection.displayName];
        let result;
        if (existingId) {
            result = await updateRakutenItem(existingId, body.product, connection);
            return NextResponse.json({ error: false, rakutenItemId: result.id });
        } else {
            result = await createRakutenItem(body.product, connection);
            return NextResponse.json({ error: false, rakutenItemId: result.manageNumber });
        }
    } catch (e) {
        console.error("[Rakuten] send failed:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function handleRakutenOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: true, msg: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const data = await getRakutenOrders(connection);
        return NextResponse.json({ orders: data.orders, count: data.orders.length });
    } catch (e) {
        console.error("[Rakuten] orders fetch error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 502 });
    }
}

export async function handleRakutenOrdersPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    let imported = 0;

    try {
        const data = await getRakutenOrders(connection);
        for (const ro of data.orders) {
            const orderId = ro.orderNumber ?? ro.order_number ?? ro.orderId;
            if (!orderId) continue;

            const existing = await Order.findOne({ marketplaceOrderId: String(orderId) });
            if (existing) continue;

            const addr = ro.shippingModel ?? ro.shipping_model ?? {};
            const buyer = ro.orderModel ?? ro;

            const order = new Order({
                marketplaceOrderId: String(orderId),
                poNumber: `RAKUTEN-${orderId}`,
                status: "pending",
                date: ro.orderDatetime ? new Date(ro.orderDatetime) : new Date(),
                provider: connection.provider,
                marketplace: "Rakuten",
                customer: {
                    name: buyer.ordererModel?.name ?? buyer.name ?? "",
                    email: buyer.ordererModel?.emailAddress ?? buyer.emailAddress ?? "",
                    phone: buyer.ordererModel?.phoneNumber ?? "",
                },
                shippingInfo: {
                    address: addr.shippingDetailModel?.shippingAddress ?? "",
                    address2: "",
                    city: addr.shippingDetailModel?.shippingCity ?? "",
                    state: addr.shippingDetailModel?.shippingPrefecture ?? "",
                    zip: addr.shippingDetailModel?.shippingZipCode ?? "",
                    country: "JP",
                },
                items: (ro.packageModelList ?? ro.items ?? []).flatMap(pkg =>
                    (pkg.itemModelList ?? pkg.items ?? []).map(li => ({
                        sku: li.manageNumber ?? li.itemNumber ?? "",
                        qty: li.units ?? li.quantity ?? 1,
                        price: parseFloat(li.priceTaxExcl ?? li.price ?? 0),
                        name: li.itemName ?? li.name ?? "",
                    }))
                ),
                total: parseFloat(ro.totalPrice ?? ro.total ?? 0),
            });

            try {
                await order.save();
                imported++;
            } catch (e) {
                console.log(`[Rakuten] order ${orderId} save failed:`, e.message);
            }
        }
    } catch (e) {
        console.error("[Rakuten] orders pull error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 502 });
    }

    return NextResponse.json({ error: false, imported });
}
