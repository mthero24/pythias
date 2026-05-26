import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { createPinterestCatalogItems, updatePinterestCatalogItems } from "../functions/pinterest.js";

export async function handlePinterestSendPOST(req) {
    const body = await req.json();
    const connection = await ApiKeyIntegrations.findById(body.connectionId ?? body.connection?._id);
    if (!connection) return NextResponse.json({ error: true, msg: "Connection not found" }, { status: 404 });

    try {
        const existingBatchId = body.product?.ids?.[connection.displayName];
        let result;
        if (existingBatchId) {
            result = await updatePinterestCatalogItems(existingBatchId, body.product, connection);
        } else {
            result = await createPinterestCatalogItems(body.product, connection);
        }
        return NextResponse.json({ error: false, pinterestBatchId: result.batchId });
    } catch (e) {
        console.error("[Pinterest] send failed:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

// Pinterest has no order fulfillment API — orders happen on the merchant's own site.
export async function handlePinterestOrdersGET(req) {
    return NextResponse.json({
        orders: [],
        count: 0,
        note: "Pinterest Shopping is catalog-only. Orders are placed on your own storefront, not through Pinterest.",
    });
}

export async function handlePinterestOrdersPOST(req) {
    return NextResponse.json({
        error: false,
        imported: 0,
        note: "Pinterest Shopping is catalog-only. Orders are placed on your own storefront, not through Pinterest.",
    });
}
