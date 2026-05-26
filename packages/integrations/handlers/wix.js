import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Order } from "@pythias/mongo";
import { createWixProduct, updateWixProduct, getWixOrders } from "../functions/wix.js";

export async function handleWixSendPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId ?? body.connection?._id);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const existingId = body.product?.ids?.[connection.displayName];
        const wixProduct = existingId
            ? await updateWixProduct(existingId, body.product, connection)
            : await createWixProduct(body.product, connection);

        return NextResponse.json({
            error: false,
            wixProductId: wixProduct.id,
            variantIds: (wixProduct.variants ?? []).map(v => ({
                sku: v.variant?.sku ?? v.sku ?? "",
                id: v.id,
                choices: v.choices,
            })),
        });
    } catch (e) {
        console.error("[Wix] send failed:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function handleWixOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: true, msg: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const data = await getWixOrders(connection);
        return NextResponse.json({ orders: data.orders ?? [], count: data.orders?.length ?? 0 });
    } catch (e) {
        console.error("[Wix] orders fetch error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 502 });
    }
}

export async function handleWixOrdersPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    let cursor = null;
    let imported = 0;

    do {
        let data;
        try {
            data = await getWixOrders(connection, cursor);
        } catch (e) {
            console.error("[Wix] orders pull error:", e.message);
            break;
        }

        for (const wo of (data.orders ?? [])) {
            const existing = await Order.findOne({ marketplaceOrderId: wo.id });
            if (existing) continue;

            const addr = wo.recipientInfo?.address ?? {};
            const contact = wo.recipientInfo?.contactDetails ?? {};
            const firstName = contact.firstName ?? "";
            const lastName  = contact.lastName  ?? "";

            const order = new Order({
                marketplaceOrderId: wo.id,
                poNumber: `WIX-${wo.number}`,
                status: "pending",
                date: new Date(wo.createdDate),
                provider: connection.provider,
                marketplace: "Wix",
                customer: {
                    name: `${firstName} ${lastName}`.trim(),
                    email: wo.buyerInfo?.email ?? "",
                    phone: contact.phone ?? "",
                },
                shippingInfo: {
                    address: addr.addressLine ?? addr.addressLine1 ?? "",
                    address2: addr.addressLine2 ?? "",
                    city: addr.city ?? "",
                    state: addr.subdivision?.code ?? "",
                    zip: addr.postalCode ?? "",
                    country: addr.country ?? "",
                },
                items: (wo.lineItems ?? []).map(li => ({
                    sku: li.physicalProperties?.sku ?? li.catalogReference?.catalogItemId ?? "",
                    qty: li.quantity ?? 1,
                    price: parseFloat(li.price?.amount ?? 0),
                    name: li.productName?.original ?? "",
                })),
                total: parseFloat(wo.priceSummary?.total?.amount ?? 0),
            });

            try {
                await order.save();
                imported++;
            } catch (e) {
                console.log(`[Wix] order ${wo.id} save failed:`, e.message);
            }
        }

        cursor = data.metadata?.cursors?.next ?? null;
    } while (cursor);

    return NextResponse.json({ error: false, imported });
}
