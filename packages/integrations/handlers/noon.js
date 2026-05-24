import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { getOrdersNoon, shipOrderNoon } from "../functions/noon.js";

export async function handleNoonOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    try {
        const orders = await getOrdersNoon(connection);
        return NextResponse.json({ orders, count: orders.length });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleNoonOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, orderId, trackingNumber, carrier } = body;
    if (!connectionId || !orderId || !trackingNumber) {
        return NextResponse.json({ error: "connectionId, orderId, and trackingNumber required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    try {
        const result = await shipOrderNoon(connection, orderId, { trackingNumber, carrier });
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}
