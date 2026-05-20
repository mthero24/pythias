import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import {
    testTargetConnection,
    getOrdersTarget,
    acknowledgeOrderTarget,
    shipOrderTarget,
} from "../functions/target.js";

export async function handleTargetTestPOST(req) {
    const { apiKey, sellerId, sellerToken } = await req.json();
    if (!apiKey || !sellerId || !sellerToken) {
        return NextResponse.json({ ok: false, error: "apiKey, sellerId, and sellerToken are required" }, { status: 400 });
    }
    const result = await testTargetConnection({ apiKey, sellerId, sellerToken });
    if (result.error) return NextResponse.json({ ok: false, error: result.error });
    return NextResponse.json({ ok: true });
}

export async function handleTargetOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await getOrdersTarget({
        apiKey:      connection.apiKey,
        sellerId:    connection.organization,
        sellerToken: connection.refreshToken,
    });

    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ orders: result.orders });
}

export async function handleTargetOrdersPOST(req) {
    const { connectionId, orderId, action, items, trackingNumber, shippingMethod } = await req.json();
    if (!connectionId || !orderId || !action) {
        return NextResponse.json({ error: "connectionId, orderId, and action required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const creds = {
        apiKey:      connection.apiKey,
        sellerId:    connection.organization,
        sellerToken: connection.refreshToken,
    };

    if (action === "acknowledge") {
        const result = await acknowledgeOrderTarget({ ...creds, orderId });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json({ success: true });
    }

    if (action === "ship") {
        if (!items?.length || !trackingNumber || !shippingMethod) {
            return NextResponse.json({ error: "items, trackingNumber, and shippingMethod required" }, { status: 400 });
        }
        const result = await shipOrderTarget({
            ...creds,
            orderId,
            items: items.map(i => ({
                order_line_number: i.order_line_number,
                quantity:          i.quantity,
                shipped_date:      new Date().toISOString(),
                shipping_method:   shippingMethod,
                tracking_number:   trackingNumber,
            })),
        });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json({ success: true, results: result.results });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
