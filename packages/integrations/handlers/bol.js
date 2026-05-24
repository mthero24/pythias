import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { getOrdersBol, shipOrderBol } from "../functions/bol.js";

export async function handleBolOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    try {
        const orders = await getOrdersBol(connection);
        return NextResponse.json({ orders, count: orders.length });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

// orderItems: array of orderItemId strings
// transporterCode: bol.com carrier code (PostNL, DPD-NL, DHL, UPS, FEDEX-NL, GLS, TNT, etc.)
export async function handleBolOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, trackingNumber, transporterCode, orderItems } = body;
    if (!connectionId || !trackingNumber || !orderItems?.length) {
        return NextResponse.json({ error: "connectionId, trackingNumber, and orderItems required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    try {
        const result = await shipOrderBol(connection, { trackingNumber, transporterCode, orderItems });
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}
