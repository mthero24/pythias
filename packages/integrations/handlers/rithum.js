import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Order } from "@pythias/mongo";
import { getRithumOrders, createRithumProduct, updateRithumProduct } from "../functions/rithum.js";

export async function handleRithumSendPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId ?? body.connection?._id);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const existingId = body.product?.ids?.[connection.displayName];
        let result;
        if (existingId) {
            result = await updateRithumProduct(existingId, body.product, connection);
        } else {
            result = await createRithumProduct(body.product, connection);
        }
        return NextResponse.json({ error: false, rithumProductId: result.productId });
    } catch (e) {
        console.error("[Rithum] send failed:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function handleRithumOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: true, msg: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const data = await getRithumOrders(connection, 0);
        return NextResponse.json({ orders: data.orders, count: data.orders.length });
    } catch (e) {
        console.error("[Rithum] orders fetch error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 502 });
    }
}

export async function handleRithumOrdersPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    let skip = 0;
    let imported = 0;

    do {
        let data;
        try {
            data = await getRithumOrders(connection, skip);
        } catch (e) {
            console.error("[Rithum] orders pull error:", e.message);
            break;
        }

        if (!data.orders.length) break;

        for (const oo of data.orders) {
            const existing = await Order.findOne({ marketplaceOrderId: String(oo.OrderID) });
            if (existing) continue;

            const addr = oo.ShippingAddress ?? {};
            const order = new Order({
                marketplaceOrderId: String(oo.OrderID),
                poNumber: `RITHUM-${oo.OrderID}`,
                status: "pending",
                date: oo.CreatedDateUtc ? new Date(oo.CreatedDateUtc) : new Date(),
                provider: connection.provider,
                marketplace: "Rithum",
                customer: {
                    name: addr.Name ?? "",
                    email: oo.BuyerEmail ?? "",
                    phone: "",
                },
                shippingInfo: {
                    address: addr.AddressLine1 ?? addr.Line1 ?? "",
                    address2: addr.AddressLine2 ?? addr.Line2 ?? "",
                    city: addr.City ?? "",
                    state: addr.StateOrRegion ?? addr.StateOrProvince ?? "",
                    zip: addr.PostalCode ?? "",
                    country: addr.CountryCode ?? "US",
                },
                items: (oo.Items ?? []).map(li => ({
                    sku: li.Sku ?? "",
                    qty: li.Quantity ?? 1,
                    price: parseFloat(li.UnitPrice ?? 0),
                    name: li.Title ?? "",
                })),
                total: parseFloat(oo.TotalPrice ?? 0),
            });

            try {
                await order.save();
                imported++;
            } catch (e) {
                console.log(`[Rithum] order ${oo.OrderID} save failed:`, e.message);
            }
        }

        skip += data.orders.length;
        if (!data.hasMore) break;
    } while (true);

    return NextResponse.json({ error: false, imported });
}
