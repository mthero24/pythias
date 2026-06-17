export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront, logError } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const range = new URL(req.url).searchParams.get("range") || "30d";
    try {
        const [list, roi] = await Promise.all([storefront.listChannels(orgId), storefront.channelRoi(orgId, range)]);
        return NextResponse.json({ error: false, ...list, roi });
    } catch (e) { return svcError(e); }
}
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try {
        if (b.op === "sync") return NextResponse.json({ error: false, result: await (b.channel === "microsoft" ? storefront.microsoftSyncProducts(orgId) : b.channel === "meta" ? storefront.metaSyncProducts(orgId) : b.channel === "pinterest" ? storefront.pinterestSyncProducts(orgId) : b.channel === "tiktok" ? storefront.tiktokSyncProducts(orgId) : b.channel === "snapchat" ? storefront.snapchatSyncProducts(orgId) : b.channel === "x" ? storefront.xSyncProducts(orgId) : storefront.googleSyncProducts(orgId)) });
        if (b.op === "disconnect") return NextResponse.json({ error: false, ...(await storefront.disconnectChannel(orgId, b.channel)) });
        if (b.op === "set-account") return NextResponse.json({ error: false, ...(await storefront.setChannelAccount(orgId, b.channel, b.accountId)) });
        if (b.op === "set-ads-account") return NextResponse.json({ error: false, ...(await storefront.setChannelAdsAccount(orgId, b.channel, b.adsCustomerId)) });
        if (b.op === "sync-adspend") return NextResponse.json({ error: false, result: await storefront.syncChannelAdSpend(orgId, b.channel) });
        if (b.op === "preview") return NextResponse.json({ error: false, preview: await storefront.channelPreview(orgId, b.channel) });
        if (b.op === "optimize") return NextResponse.json({ error: false, ...(await storefront.optimizeChannelListings(orgId, b.channel)) });
        if (b.op === "ad-spend") return NextResponse.json({ error: false, ...(await storefront.recordAdSpend(orgId, b)) });
        return NextResponse.json({ error: "Unknown op" }, { status: 400 });
    } catch (e) {
        if (b.op === "sync") logError({ error: e, app: "premier", provider: "premierPrinting", source: "POST /api/admin/storefront/channels", context: { channel: b.channel, op: "sync" } });
        return svcError(e);
    }
}
