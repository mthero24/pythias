import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import {
    getOrdersMirakl, getOrderMirakl, acceptOrderMirakl, shipOrderMirakl, getOffersMirakl,
} from "../functions/mirakl.js";

async function getConnection(connectionId) {
    const conn = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!conn) return null;
    return conn;
}

// GET /api/integrations/mirakl/orders?connectionId=&orderStates=&start=&max=&startDate=&endDate=
export async function handleMiraklOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const conn = await getConnection(connectionId);
    if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await getOrdersMirakl({
        apiKey:      conn.apiKey,
        baseUrl:     conn.organization,
        orderStates: searchParams.get("orderStates") ?? undefined,
        start:       Number(searchParams.get("start")  ?? 0),
        max:         Number(searchParams.get("max")    ?? 100),
        startDate:   searchParams.get("startDate")  ?? undefined,
        endDate:     searchParams.get("endDate")    ?? undefined,
    });

    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ orders: result.orders, total: result.total });
}

// POST /api/integrations/mirakl/orders
// body: { connectionId, orderId, action: "accept" | "ship", carrier, carrierName, trackingNumber, trackingUrl, shippingDate }
export async function handleMiraklOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, orderId, action } = body;

    if (!connectionId || !orderId || !action) {
        return NextResponse.json({ error: "connectionId, orderId, and action are required" }, { status: 400 });
    }

    const conn = await getConnection(connectionId);
    if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const creds = { apiKey: conn.apiKey, baseUrl: conn.organization };

    if (action === "accept") {
        const result = await acceptOrderMirakl({ ...creds, orderId });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json({ success: true, data: result.data });
    }

    if (action === "ship") {
        const { carrier, carrierName, trackingNumber, trackingUrl, shippingDate } = body;
        if (!carrier || !trackingNumber) {
            return NextResponse.json({ error: "carrier and trackingNumber are required for ship" }, { status: 400 });
        }
        const result = await shipOrderMirakl({ ...creds, orderId, carrier, carrierName, trackingNumber, trackingUrl, shippingDate });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
        return NextResponse.json({ success: true, data: result.data });
    }

    return NextResponse.json({ error: `Unknown action "${action}". Valid: accept, ship` }, { status: 400 });
}

// GET /api/integrations/mirakl?connectionId=
// Returns the connection info (for page load / profile check)
export async function handleMiraklGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const conn = await getConnection(connectionId);
    if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    // Quick connectivity check — fetch 1 order
    const result = await getOrdersMirakl({ apiKey: conn.apiKey, baseUrl: conn.organization, max: 1 });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });

    return NextResponse.json({ connected: true, total: result.total });
}

// GET /api/integrations/mirakl/offers?connectionId=&start=&max=
export async function handleMiraklOffersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    const conn = await getConnection(connectionId);
    if (!conn) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    const result = await getOffersMirakl({
        apiKey:  conn.apiKey,
        baseUrl: conn.organization,
        start:   Number(searchParams.get("start") ?? 0),
        max:     Number(searchParams.get("max")   ?? 100),
    });

    if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ offers: result.offers, total: result.total });
}
