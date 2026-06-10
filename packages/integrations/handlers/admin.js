import { NextResponse } from "next/server";
import { ApiKeyIntegrations, TikTokAuth, Settings } from "@pythias/mongo";
import { generateAuthorizationUrl } from "../functions/tiktokpy.js";

const ALLOWED_SETTINGS_FIELDS = new Set(["pullOrdersEnabled"]);

const PROVIDER_DISPLAY_NAMES = {
    premierPrinting: "Premier Printing",
    printthreads: "Print Threads",
    "pythias-test": "pythias test",
};

export async function handleAdminIntegrationsGET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const provider = searchParams.get("provider");
        const orgId = searchParams.get("orgId");

        // Platform orgs: filter strictly by orgId
        if (orgId) {
            const [baseIntegrations, tiktokAuth] = await Promise.all([
                ApiKeyIntegrations.find({ orgId }).lean(),
                TikTokAuth.find({ orgId }),
            ]);
            const integration = baseIntegrations.map(a =>
                (!a.type && a.displayName?.startsWith("shopify-")) ? { ...a, type: "shopify" } : a
            );
            return NextResponse.json({ error: false, integration, tiktokAuth });
        }

        const filter = provider ? { provider } : {};

        const [baseIntegrations, tiktokAuth] = await Promise.all([
            ApiKeyIntegrations.find(filter).lean(),
            TikTokAuth.find(filter),
        ]);

        if (!provider) {
            const integration = baseIntegrations.map(a =>
                (!a.type && a.displayName?.startsWith("shopify-")) ? { ...a, type: "shopify" } : a
            );
            return NextResponse.json({ error: false, integration, tiktokAuth });
        }

        // Split provider-filtered results into non-shopify and shopify
        const nonShopify = baseIntegrations.filter(
            a => a.type !== "shopify" && !a.displayName?.startsWith("shopify-")
        );

        // Fetch ALL shopify entries — legacy entries may have provider "pythias-test" or null
        const allApiShopify = await ApiKeyIntegrations.find({ displayName: /^shopify-/ }).lean();

        const providerDisplayName = PROVIDER_DISPLAY_NAMES[provider];
        const shopifyIntegrations = allApiShopify
            .filter(s =>
                s.provider === provider ||
                (providerDisplayName && s.provider === providerDisplayName) ||
                !s.provider ||
                s.provider === "pythias-test" ||
                s.provider === "pythias test"
            )
            .map(s => ({ ...s, type: "shopify" }));

        const integration = [...nonShopify, ...shopifyIntegrations];
        return NextResponse.json({ error: false, integration, tiktokAuth });
    } catch (err) {
        console.error("Error fetching integration:", err);
        return NextResponse.json({ error: true, message: "Error fetching integration" });
    }
}

export async function handleAdminIntegrationsPOST(req) {
    let data = await req.json();
    if (data.type == "tiktok") {
        try {
            const orgId = data.orgId ?? null;
            const filter = orgId
                ? { seller_name: data.seller_name, orgId }
                : { seller_name: data.seller_name, provider: data.provider };
            let auth = await TikTokAuth.findOne(filter);
            if (!auth) {
                auth = new TikTokAuth({ seller_name: data.seller_name, provider: data.provider, orgId });
                await auth.save();
            }
            let url = await generateAuthorizationUrl(auth._id.toString());
            return NextResponse.json({ error: false, url });
        } catch (err) {
            console.error("TikTok auth error:", err.message);
            return NextResponse.json({ error: true, msg: err.message }, { status: 500 });
        }
    } else if (["acenda","walmart","faire","shein","temu","wix","woocommerce","squarespace","meta","pinterest","onbuy","rakuten","wayfair","rithum","noon","bol"].includes(data.type)) {
        const orgId = data.orgId ?? null;
        const findFilter = orgId
            ? { displayName: data.displayName, orgId }
            : { displayName: data.displayName, provider: data.provider };
        let integration = await ApiKeyIntegrations.findOne(findFilter);
        if (!integration) {
            integration = new ApiKeyIntegrations({
                displayName: data.displayName,
                apiKey: data.apiKey,
                apiSecret: data.apiSecret,
                organization: data.organization,
                refreshToken: data.refreshToken,
                shopId: data.shopId,
                provider: data.provider,
                type: data.type,
                orgId,
            });
            await integration.save();
        } else {
            integration.provider = data.provider;
            integration.apiKey = data.apiKey;
            integration.apiSecret = data.apiSecret;
            integration.organization = data.organization;
            if (data.refreshToken !== undefined) integration.refreshToken = data.refreshToken;
            if (data.shopId !== undefined) integration.shopId = data.shopId;
            integration.type = data.type;
            await integration.save();
        }
        const listFilter = orgId
            ? { $or: [{ orgId }, { provider: data.provider, orgId: null }] }
            : { provider: data.provider };
        let integrations = await ApiKeyIntegrations.find(listFilter);
        return NextResponse.json({ error: false, integrations });
    }
}

export async function handleAdminIntegrationsDELETE(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const type = searchParams.get("type");
    try {
        if (type === "channelengine") {
            await Settings.deleteMany({ key: { $in: ["channelengine.apiUrl", "channelengine.apiKey"] } });
            return NextResponse.json({ error: false });
        }
        if (type === "gs1") {
            await Settings.deleteMany({ key: { $in: ["gs1.apiKey", "gs1.secondaryKey", "gs1.accountNumber"] } });
            return NextResponse.json({ error: false });
        }
        if (!connectionId) return NextResponse.json({ error: true, message: "connectionId required" }, { status: 400 });
        if (type === "tiktok") {
            await TikTokAuth.findByIdAndDelete(connectionId);
        } else {
            await ApiKeyIntegrations.findByIdAndDelete(connectionId);
        }
        return NextResponse.json({ error: false });
    } catch (err) {
        console.error("Delete integration error:", err);
        return NextResponse.json({ error: true, message: "Delete failed" }, { status: 500 });
    }
}

export async function handleAdminIntegrationsSettingsPATCH(req) {
    const body = await req.json();
    const { connectionId, field, value } = body;

    if (!connectionId || !field) {
        return NextResponse.json({ error: "connectionId and field are required" }, { status: 400 });
    }
    if (!ALLOWED_SETTINGS_FIELDS.has(field)) {
        return NextResponse.json({ error: `Field "${field}" is not toggleable` }, { status: 400 });
    }

    const connection = await ApiKeyIntegrations.findByIdAndUpdate(
        connectionId,
        { [field]: value },
        { new: true }
    ).lean();

    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    return NextResponse.json({ success: true, connection });
}
