export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg } from "@/lib/storefrontOrg";

export async function GET(req, { params }) {
    const { channel } = await params;
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.redirect(new URL("/admin", req.url));
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/storefront/channels/${channel}/callback`;
    try {
        return NextResponse.redirect(await storefront.channelConnectStart(channel, { orgId, premier: true, redirectUri }));
    } catch (e) {
        return NextResponse.redirect(new URL(`/admin/store/channels?error=${encodeURIComponent(e.message)}`, req.url));
    }
}
