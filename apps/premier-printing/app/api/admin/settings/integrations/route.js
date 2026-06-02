import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Settings } from "@pythias/mongo";

const STRING_KEYS = [
    "localIP", "localKey",
    "shipstation.apiKey", "shipstation.apiSecret", "shipstation.v2Key",
    "usps.clientId", "usps.clientSecret", "usps.accountNumber", "usps.crid", "usps.mid", "usps.manifestMid",
    "ups.clientId", "ups.clientSecret", "ups.accountNumber",
    "endicia.requesterId", "endicia.accountNumber", "endicia.passPhrase",
    "fedex.accountNumber", "fedex.clientId", "fedex.clientSecret",
    "shopify.storeUrl", "shopify.accessToken", "shopify.apiKey", "shopify.apiSecret",
    "walmart.clientId", "walmart.clientSecret",
    "etsy.apiKey", "etsy.shopId",
    "tiktok.appKey", "tiktok.appSecret", "tiktok.accessToken", "tiktok.shopId",
    "amazon.sellerId", "amazon.marketplaceId", "amazon.lwaClientId", "amazon.lwaClientSecret", "amazon.refreshToken",
    "ebay.appId", "ebay.certId", "ebay.devId", "ebay.accessToken",
    "faire.applicationId", "faire.secretId",
    "acenda.clientId", "acenda.clientSecret", "acenda.organization",
    "mirakl.shopUrl", "mirakl.apiKey",
    "channelengine.apiUrl", "channelengine.apiKey",
    "wasabi.keyId", "wasabi.secret", "wasabi.bucket", "wasabi.region",
    "dhl.accountNumber", "dhl.clientId", "dhl.clientSecret",
    "businessAddress.name", "businessAddress.businessName", "businessAddress.address1",
    "businessAddress.address2", "businessAddress.city", "businessAddress.state",
    "businessAddress.postalCode", "businessAddress.country", "businessAddress.emailAddress", "businessAddress.phone",
];

const ARRAY_KEYS = ["shippingLabelPrinters", "productionLabelPrinters", "scales"];
const OBJECT_KEYS = ["production"];
const ALL_KEYS = [...STRING_KEYS, ...ARRAY_KEYS, ...OBJECT_KEYS];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const docs = await Settings.find({ key: { $in: ALL_KEYS } }).lean();
    const map = Object.fromEntries(docs.map(d => [d.key, d.value]));

    const creds = {};

    for (const [k, v] of Object.entries(map)) {
        if (ARRAY_KEYS.includes(k) || OBJECT_KEYS.includes(k)) continue;
        const parts = k.split(".");
        let obj = creds;
        for (let i = 0; i < parts.length - 1; i++) {
            obj[parts[i]] = obj[parts[i]] ?? {};
            obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = v;
    }

    for (const k of ARRAY_KEYS) {
        try { creds[k] = map[k] ? JSON.parse(map[k]) : []; } catch { creds[k] = []; }
    }

    for (const k of OBJECT_KEYS) {
        try { creds[k] = map[k] ? JSON.parse(map[k]) : {}; } catch { creds[k] = {}; }
    }

    return NextResponse.json({ creds });
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "manager"].includes(session.user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const ops = [];

    for (const k of ARRAY_KEYS) {
        if (Array.isArray(body[k])) {
            ops.push(Settings.findOneAndUpdate({ key: k }, { key: k, value: JSON.stringify(body[k]) }, { upsert: true }));
        }
    }

    for (const k of OBJECT_KEYS) {
        if (body[k] !== undefined && typeof body[k] === "object") {
            ops.push(Settings.findOneAndUpdate({ key: k }, { key: k, value: JSON.stringify(body[k]) }, { upsert: true }));
        }
    }

    const flat = flattenKeys(body);
    for (const [k, v] of Object.entries(flat)) {
        if (!STRING_KEYS.includes(k)) continue;
        ops.push(Settings.findOneAndUpdate({ key: k }, { key: k, value: v }, { upsert: true }));
    }

    await Promise.all(ops);
    return NextResponse.json({ ok: true });
}

function flattenKeys(obj, prefix = "") {
    const out = {};
    for (const [k, v] of Object.entries(obj ?? {})) {
        if (ARRAY_KEYS.includes(prefix ? `${prefix}.${k}` : k)) continue;
        const path = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) {
            Object.assign(out, flattenKeys(v, path));
        } else if (v !== undefined && v !== null) {
            out[path] = v;
        }
    }
    return out;
}
