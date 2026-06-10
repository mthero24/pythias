import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import axios from "axios";
import { createDraftListing, updateListingFrom, getOpenReceiptsEtsy, createReceiptShipment, getEtsyTaxonomyAttributes } from "../functions/etsy.js";

const CLIENT_ID = process.env.etsyApiKey?.split(":")[0];
const CLIENT_VERIFIER = "catsaregreat";

export async function handleEtsyGET(req) {
    return Response.json({ error: "not implemented" });
}

export async function handleEtsyPOST(req) {
    const body = await req.json();
    let connection = await ApiKeyIntegrations.findOne({ _id: body.connection._id });
    let res = await createDraftListing(body.product, connection);
    return NextResponse.json({ success: true, productId: res });
}

export async function handleEtsyPUT(req) {
    const body = await req.json();
    let connection = await ApiKeyIntegrations.findOne({ _id: body.connection._id });
    await updateListingFrom(body.listingId, body.product, connection);
    return NextResponse.json({ success: true });
}

export async function handleEtsyOrdersGET(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) return NextResponse.json({ error: "connectionId required" }, { status: 400 });

    // Must NOT use .lean() — credentials.save() is called inside getOpenReceiptsEtsy
    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    try {
        const data = await getOpenReceiptsEtsy(connection);
        return NextResponse.json({ orders: data?.results ?? [], count: data?.count ?? 0 });
    } catch (e) {
        console.error("Etsy orders fetch error:", e.message);
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}

export async function handleAdminEtsyGET(req) {
    const { searchParams } = new URL(req.url);
    const taxonomyId = parseInt(searchParams.get("taxonomyId") ?? "482", 10);
    const result = await getEtsyTaxonomyAttributes(taxonomyId);
    if (result.error) return NextResponse.json({ error: true, msg: result.msg }, { status: 400 });
    return NextResponse.json(result);
}

const extractMpValues = (product, connectionId) => {
    const connId = connectionId?.toString();
    const mp = (product.marketPlacesArray ?? []).find(m =>
        (m.connections ?? []).some(c => (c?._id ?? c)?.toString() === connId)
    );
    const mpId = mp?._id?.toString();
    return (mpId && product.marketplaceValues?.[mpId]) ? product.marketplaceValues[mpId] : {};
};

export async function handleAdminEtsyPOST(req) {
    const body = await req.json();
    let connection = await ApiKeyIntegrations.findOne({ _id: body.connection._id });
    const marketplaceValues = extractMpValues(body.product, body.connection._id);
    let res = await createDraftListing(body.product, connection, marketplaceValues);
    return NextResponse.json({ success: true, productId: res });
}

export async function handleAdminEtsyPUT(req) {
    const body = await req.json();
    let connection = await ApiKeyIntegrations.findOne({ _id: body.connection._id });
    await updateListingFrom(body.listingId, body.product, connection);
    return NextResponse.json({ success: true });
}

// config: { redirectUri, provider, adminUrl }
export function makeEtsyOAuthRedirectGET({ redirectUri, provider, adminUrl }) {
    return async function handleEtsyOAuthRedirectGET(req) {
        let code = req.nextUrl.searchParams.get("code");
        const tokenUrl = "https://api.etsy.com/v3/public/oauth/token";
        const requestOptions = {
            method: "POST",
            body: JSON.stringify({
                grant_type: "authorization_code",
                client_id: CLIENT_ID,
                redirect_uri: redirectUri,
                code,
                code_verifier: CLIENT_VERIFIER,
            }),
            headers: { "Content-Type": "application/json" },
        };
        try {
            const response = await fetch(tokenUrl, requestOptions);
            const data = await response.json();
            let res = await axios.get("https://openapi.etsy.com/v3/application/users/me", {
                headers: {
                    Authorization: `Bearer ${data.access_token}`,
                    "x-api-key": `${process.env.etsyApiKey}`,
                },
            }).catch(e => console.log(e.response?.data, "error"));
            let conn = new ApiKeyIntegrations({
                apiKey: data.access_token,
                apiSecret: CLIENT_VERIFIER,
                organization: "admin",
                provider,
                type: "etsy",
                refreshToken: data.refresh_token,
                tokenType: "bearer",
                displayName: "Etsy Shop",
                userId: res?.data?.user_id,
                shopId: res?.data?.shop_id,
            });
            await conn.save();
            return NextResponse.redirect(adminUrl);
        } catch (e) {
            console.log(e);
            return Response.json({ error: e.toString() }, { status: 500 });
        }
    };
}

export async function handleEtsyOrdersPOST(req) {
    const body = await req.json();
    const { connectionId, receiptId, trackingCode, carrier } = body;
    if (!connectionId || !receiptId || !trackingCode) {
        return NextResponse.json({ error: "connectionId, receiptId, and trackingCode are required" }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findById(connectionId);
    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    try {
        const result = await createReceiptShipment(connection, receiptId, trackingCode, carrier ?? "other");
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}
