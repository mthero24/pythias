export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId } from "@/lib/storefrontRoute";

// GET /api/storefront/channels/[channel]/connect — start OAuth: redirect the seller to the
// channel's consent screen. State (orgId+channel+slug) is HMAC-signed so the callback can trust it.
export async function GET(req, { params }) {
    const { channel } = await params;
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.redirect(new URL("/login", req.url));
    const org = await Organization.findById(orgId).select("slug").lean();
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/storefront/channels/${channel}/callback`;
    try {
        return NextResponse.redirect(await storefront.channelConnectStart(channel, { orgId, slug: org?.slug, redirectUri }));
    } catch (e) {
        return NextResponse.redirect(new URL(`/${org?.slug}/channels?error=${encodeURIComponent(e.message)}`, req.url));
    }
}
