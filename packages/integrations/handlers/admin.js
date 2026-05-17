import { NextResponse } from "next/server";
import { ApiKeyIntegrations, TikTokAuth } from "@pythias/mongo";
import { generateAuthorizationUrl } from "../functions/tiktokpy.js";

const ALLOWED_SETTINGS_FIELDS = new Set(["pullOrdersEnabled"]);

export async function handleAdminIntegrationsGET(req) {
    try {
        let integration = await ApiKeyIntegrations.find();
        return NextResponse.json({ error: false, integration });
    } catch (err) {
        console.error("Error fetching integration:", err);
        return NextResponse.json({ error: true, message: "Error fetching integration" });
    }
}

export async function handleAdminIntegrationsPOST(req) {
    let data = await req.json();
    if (data.type == "tiktok") {
        let auth = await TikTokAuth.findOne({ seller_name: data.seller_name });
        if (!auth) {
            auth = new TikTokAuth({ seller_name: data.seller_name, provider: data.provider });
            await auth.save();
        } else if (!auth.provider) {
            auth.provider = data.provider;
            await auth.save();
        }
        let url = await generateAuthorizationUrl();
        return NextResponse.json({ error: false, url });
    } else if (data.type == "acenda" || data.type == "walmart" || data.type == "faire" || data.type == "shein" || data.type == "temu") {
        let integration = await ApiKeyIntegrations.findOne({ displayName: data.displayName, provider: data.provider });
        if (!integration) {
            integration = new ApiKeyIntegrations({
                displayName: data.displayName,
                apiKey: data.apiKey,
                apiSecret: data.apiSecret,
                organization: data.organization,
                refreshToken: data.refreshToken,
                provider: data.provider,
                type: data.type,
            });
            await integration.save();
        } else {
            integration.provider = data.provider;
            integration.apiKey = data.apiKey;
            integration.apiSecret = data.apiSecret;
            integration.organization = data.organization;
            if (data.refreshToken !== undefined) integration.refreshToken = data.refreshToken;
            integration.type = data.type;
            await integration.save();
        }
        let integrations = await ApiKeyIntegrations.find({ provider: data.provider });
        return NextResponse.json({ error: false, integrations });
    }
}

export async function handleAdminIntegrationsDELETE(req) {
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const type = searchParams.get("type");
    if (!connectionId) return NextResponse.json({ error: true, message: "connectionId required" }, { status: 400 });
    try {
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
