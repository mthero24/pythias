import { NextResponse } from "next/server";
import { ApiKeyIntegrations, Order } from "@pythias/mongo";
import { createSquarespaceProduct, updateSquarespaceProduct, getSquarespaceOrders } from "../functions/squarespace.js";

export async function handleSquarespaceSendPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId ?? body.connection?._id);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const existingId = body.product?.ids?.[connection.displayName];
        const sqProduct = existingId
            ? await updateSquarespaceProduct(existingId, body.product, connection)
            : await createSquarespaceProduct(body.product, connection);

        const resultProduct = sqProduct.product ?? sqProduct;
        return NextResponse.json({
            error: false,
            squarespaceProductId: resultProduct.id,
            variantIds: (resultProduct.variants ?? []).map(v => ({
                sku: v.sku ?? "",
                id: v.id ?? "",
            })),
        });
    } catch (e) {
        console.error("[Squarespace] send failed:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function handleSquarespaceOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: true, msg: "connectionId required" }, { status: 400 });
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const data = await getSquarespaceOrders(connection);
        return NextResponse.json({ orders: data.result ?? [], count: data.result?.length ?? 0 });
    } catch (e) {
        console.error("[Squarespace] orders fetch error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 502 });
    }
}

export async function handleSquarespaceOrdersPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    let cursor = null;
    let imported = 0;

    do {
        let data;
        try {
            data = await getSquarespaceOrders(connection, cursor);
        } catch (e) {
            console.error("[Squarespace] orders pull error:", e.message);
            break;
        }

        for (const so of (data.result ?? [])) {
            const existing = await Order.findOne({ marketplaceOrderId: so.id });
            if (existing) continue;

            const addr = so.shippingAddress ?? so.billingAddress ?? {};
            const order = new Order({
                marketplaceOrderId: so.id,
                poNumber: `SQ-${so.orderNumber}`,
                status: "pending",
                date: new Date(so.createdOn ?? Date.now()),
                provider: connection.provider,
                marketplace: "Squarespace",
                customer: {
                    name: `${addr.firstName ?? ""} ${addr.lastName ?? ""}`.trim(),
                    email: so.customerEmail ?? "",
                    phone: addr.phone ?? "",
                },
                shippingInfo: {
                    address:  addr.address1 ?? "",
                    address2: addr.address2 ?? "",
                    city:     addr.city ?? "",
                    state:    addr.state ?? "",
                    zip:      addr.postalCode ?? "",
                    country:  addr.countryCode ?? "",
                },
                items: (so.lineItems ?? []).map(li => ({
                    sku:   li.sku ?? "",
                    qty:   li.quantity ?? 1,
                    price: parseFloat(li.unitPricePaid?.value ?? 0),
                    name:  li.productName ?? "",
                })),
                total: parseFloat(so.grandTotal?.value ?? 0),
            });

            try {
                await order.save();
                imported++;
            } catch (e) {
                console.log(`[Squarespace] order ${so.id} save failed:`, e.message);
            }
        }

        cursor = data.pagination?.nextPageCursor ?? null;
    } while (cursor);

    return NextResponse.json({ error: false, imported });
}
