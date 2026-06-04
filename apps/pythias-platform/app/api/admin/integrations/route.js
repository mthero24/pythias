import { NextResponse } from "next/server";
import { handleAdminIntegrationsGET, handleAdminIntegrationsPOST, handleAdminIntegrationsDELETE } from "@pythias/integrations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { TikTokAuth, ApiKeyIntegrations, PlatformMarketPlace } from "@pythias/mongo";
export const dynamic = 'force-dynamic';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId ?? null;
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    const res = await handleAdminIntegrationsGET(req);
    const data = await res.json();

    // Override with orgId-aware queries so connections show regardless of provider value
    if (orgId) {
        const filter = provider
            ? { $or: [{ orgId }, { provider, orgId: null }] }
            : { orgId };

        const [tiktokAuth, allIntegrations] = await Promise.all([
            TikTokAuth.find(filter).lean().catch(() => []),
            ApiKeyIntegrations.find(filter).lean().catch(() => []),
        ]);

        data.tiktokAuth = JSON.parse(JSON.stringify(tiktokAuth));

        const nonShopify = allIntegrations.filter(
            a => a.type !== "shopify" && !a.displayName?.startsWith("shopify-")
        );
        const shopify = allIntegrations
            .filter(a => a.type === "shopify" || a.displayName?.startsWith("shopify-"))
            .map(a => ({ ...a, type: "shopify" }));
        data.integration = JSON.parse(JSON.stringify([...nonShopify, ...shopify]));
    }

    if (!data.error && process.env.ChannelEnginAPIURL && process.env.ChannelEnginAPIKey) {
        const ceConnection = {
            _id: "channelengine",
            displayName: "ChannelEngine",
            type: "channelengine",
            provider: "premierPrinting",
        };
        data.integration = [...(data.integration ?? []), ceConnection];
    }

    return NextResponse.json(data);
}

export const POST = handleAdminIntegrationsPOST;

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId ?? null;

    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");

    const res = await handleAdminIntegrationsDELETE(req);

    if (orgId && connectionId) {
        await PlatformMarketPlace.updateMany(
            { orgId, connections: connectionId },
            { $pull: { connections: connectionId } }
        ).catch(() => {});
    }

    return res;
}
