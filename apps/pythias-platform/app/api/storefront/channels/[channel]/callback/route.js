export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";

// GET /api/storefront/channels/[channel]/callback — OAuth redirect target. Trusts the signed
// state (not the session), exchanges the code for tokens, stores the connection, and returns.
export async function GET(req, { params }) {
    const { channel } = await params;
    const url = new URL(req.url);

    // OAuth 1.0a (X): no signed state — finish via the request token + verifier.
    const oauthToken = url.searchParams.get("oauth_token");
    if (oauthToken && url.searchParams.get("oauth_verifier")) {
        try {
            const r = await storefront.finishOAuth1(channel, { oauthToken, verifier: url.searchParams.get("oauth_verifier") });
            return NextResponse.redirect(new URL(`/${r.slug}/channels?connected=${channel}`, req.url));
        } catch (e) {
            return NextResponse.redirect(new URL(`/?channelError=${encodeURIComponent(e.message)}`, req.url));
        }
    }
    if (url.searchParams.get("denied")) return NextResponse.redirect(new URL("/", req.url));   // X user declined

    const code = url.searchParams.get("code") || url.searchParams.get("auth_code");   // TikTok returns auth_code
    const state = storefront.readChannelState(url.searchParams.get("state"));
    if (!state || state.channel !== channel) return NextResponse.redirect(new URL("/login", req.url));
    const dest = `/${state.slug}/channels`;
    if (url.searchParams.get("error") || !code) return NextResponse.redirect(new URL(`${dest}?error=${encodeURIComponent(url.searchParams.get("error") || "no_code")}`, req.url));
    const redirectUri = `${url.origin}/api/storefront/channels/${channel}/callback`;
    try {
        await storefront.exchangeAndSaveChannel(state.orgId, channel, code, redirectUri, { codeVerifier: state.v });
        return NextResponse.redirect(new URL(`${dest}?connected=${channel}`, req.url));
    } catch (e) {
        return NextResponse.redirect(new URL(`${dest}?error=${encodeURIComponent(e.message)}`, req.url));
    }
}
