/**
 * Walmart integration test script.
 * Usage: node --env-file=.env.local scripts/testWalmart.mjs
 *
 * Steps:
 *   1. Connect to MongoDB and find Walmart ApiKeyIntegrations record
 *   2. Test auth token
 *   3. Get items from Walmart (list existing)
 *   4. Build a feed payload from a real product
 *   5. Optionally send to Walmart (set SEND=true env var to actually submit)
 */

import axios from "axios";
import mongoose from "mongoose";
import { randomUUID } from "crypto";

const BASE = "https://marketplace.walmartapis.com/v3";
const MONGO_URL = process.env.pythiasMongoURL;
const SEND = process.env.SEND === "true";

if (!MONGO_URL) {
    console.error("pythiasMongoURL not set — run with --env-file=.env.local");
    process.exit(1);
}

// ── Minimal schemas for test ─────────────────────────────────────────────────
const conn = mongoose.createConnection(MONGO_URL);

const ApiKeyIntegrations = conn.model("ApiKeyIntegrations", new mongoose.Schema({
    displayName: String, apiKey: String, apiSecret: String, organization: String, type: String, provider: String,
}));

const Products = conn.model("Products", new mongoose.Schema({
    name: String, title: String, description: String, sku: String,
    brand: mongoose.Schema.Types.Mixed,
    gender: String,
    variantsArray: [mongoose.Schema.Types.Mixed],
    productImages: [mongoose.Schema.Types.Mixed],
    blanks: [mongoose.Schema.Types.Mixed],
}));

// ── Walmart helpers (inline to avoid ESM package complications) ───────────────
async function getToken(clientId, clientSecret, partnerId) {
    const params = new URLSearchParams({ grant_type: "client_credentials" });
    const res = await axios.post(`${BASE}/token`, params.toString(), {
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "WM_PARTNER.ID": partnerId,
            "WM_QOS.CORRELATION_ID": randomUUID(),
            "WM_SVC.NAME": "Walmart Marketplace",
        },
        auth: { username: clientId, password: clientSecret },
    });
    return res.data.access_token;
}

function headers(token, partnerId, extra = {}) {
    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        "WM_SEC.ACCESS_TOKEN": token,
        "WM_PARTNER.ID": partnerId,
        "WM_QOS.CORRELATION_ID": randomUUID(),
        "WM_SVC.NAME": "Walmart Marketplace",
        ...extra,
    };
}

async function sendFeed(token, partnerId, payload) {
    const json = Buffer.from(JSON.stringify(payload));
    const boundary = `----WalmartBoundary${Date.now()}`;
    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="items.json"\r\nContent-Type: application/json\r\n\r\n`),
        json,
        Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const res = await axios.post(`${BASE}/feeds?feedType=MP_ITEM`, body, {
        headers: headers(token, partnerId, {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
        }),
    });
    return res.data;
}

function buildItem(product, variant) {
    const colorName = variant.color?.name ?? "";
    const sizeName  = variant.size?.name ?? "";
    const weight    = variant.size?.weight ?? 0.5;
    const price     = variant.size?.retailPrice ?? 0;
    const parentSku = product.sku ?? product.name?.replace(/ /g, "-").toLowerCase();
    const brand     = typeof product.brand === "object" ? product.brand?.name : (product.brand ?? "Pythias");
    const category  = product.blanks?.[0]?.category?.[0] ?? "T-Shirts";
    const mainImage = variant.image ?? product.productImages?.[0]?.image ?? "";
    const secondary = [
        ...(product.productImages ?? []).slice(1).map(i => i.image).filter(Boolean),
        ...(variant.images ?? []).filter(Boolean),
    ];
    return {
        sku: variant.sku,
        productType: category,
        productName: `${product.title ?? product.name} - ${colorName} - ${sizeName}`,
        productDescription: product.description ?? product.title ?? product.name ?? "",
        price,
        currency: "USD",
        shippingWeight: weight,
        brand,
        mainImageUrl: mainImage,
        productSecondaryImageURL: secondary,
        upc: variant.upc,
        variantGroupId: parentSku,
        variantAttributeNames: ["color", "size"],
        color: colorName,
        size: sizeName,
        gender: product.gender ?? "Unisex Adults",
        isPrimaryVariant: false,
        swatchImages: mainImage ? [{ swatchImageUrl: mainImage, swatchVariantAttribute: "color" }] : [],
    };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    await conn.asPromise();
    console.log("✓ MongoDB connected");

    // 1. Find Walmart connection — DB first, then fall back to env vars
    let clientId, clientSecret, partnerId;
    const connection = await ApiKeyIntegrations.findOne({ type: "walmart" }).lean();
    if (connection) {
        clientId   = connection.apiKey;
        clientSecret = connection.apiSecret;
        partnerId  = connection.organization;
        console.log(`✓ Found DB connection: ${connection.displayName} (partnerId: ${partnerId})`);
    } else if (process.env.WALMART_CLIENT_ID && process.env.WALMART_CLIENT_SECRET && process.env.WALMART_PARTNER_ID) {
        clientId   = process.env.WALMART_CLIENT_ID;
        clientSecret = process.env.WALMART_CLIENT_SECRET;
        partnerId  = process.env.WALMART_PARTNER_ID;
        console.log(`✓ Using env var credentials (partnerId: ${partnerId})`);
    } else {
        console.error("✗ No Walmart credentials found.\n  Either:\n  - Add a connection via the integrations UI, or\n  - Add WALMART_CLIENT_ID, WALMART_CLIENT_SECRET, WALMART_PARTNER_ID to .env.local");
        process.exit(1);
    }

    // 2. Auth token
    let token;
    try {
        token = await getToken(clientId, clientSecret, partnerId);
        console.log(`✓ Auth token obtained (${token.slice(0, 20)}...)`);
    } catch (e) {
        console.error("✗ Auth failed:", e.response?.data ?? e.message);
        process.exit(1);
    }

    // 3. List existing items
    try {
        const res = await axios.get(`${BASE}/items?limit=5`, { headers: headers(token, partnerId) });
        const items = res.data?.ItemResponse ?? [];
        console.log(`✓ getItems: ${items.length} items returned`);
        if (items.length) console.log("  First item SKU:", items[0]?.sku ?? items[0]?.item?.sku);
    } catch (e) {
        console.warn("⚠ getItems failed (may be empty catalog):", e.response?.data ?? e.message);
    }

    // 4. Build feed payload from a real product
    const product = await Products.findOne({
        "variantsArray.0": { $exists: true },
        "productImages.0": { $exists: true },
    }).lean();
    if (!product) {
        console.error("✗ No product with variants found in DB");
        process.exit(1);
    }
    console.log(`✓ Test product: "${product.title ?? product.name}" — ${product.variantsArray.length} variants`);

    // Take first 2 variants only for the test
    const testVariants = product.variantsArray.slice(0, 2);
    const MPItem = testVariants.map(v => buildItem(product, v));
    const payload = {
        MPItemFeedHeader: {
            businessUnit: "WALMART_US",
            version: "2.0.20240126-12_25_52-api",
            locale: "en",
        },
        MPItem,
    };
    console.log("✓ Feed payload built:");
    console.log(JSON.stringify(MPItem[0], null, 2));

    // 5. Validate required fields
    const required = ["sku", "productType", "productName", "price", "brand"];
    const missing = [];
    for (const item of MPItem) {
        for (const f of required) {
            if (!item[f] && item[f] !== 0) missing.push(`${item.sku}.${f}`);
        }
    }
    if (missing.length) {
        console.warn("⚠ Missing required fields:", missing.join(", "));
    } else {
        console.log("✓ All required fields present");
    }

    // 6. Send (only if SEND=true)
    if (!SEND) {
        console.log("\n  Dry run complete. Set SEND=true to submit the feed to Walmart.");
    } else {
        try {
            const result = await sendFeed(token, partnerId, payload);
            console.log("✓ Feed submitted:", result);
        } catch (e) {
            console.error("✗ Feed submit failed:", e.response?.data ?? e.message);
        }
    }

    await conn.close();
}

main().catch(e => { console.error(e); process.exit(1); });
