import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import axios from "axios";

const clientID = process.env.etsyApiKey?.split(':')[0];
const clientVerifier = 'catsaregreat';

export async function GET(req) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // orgId was encoded as state in buildEtsyRedirectURI(orgId)
    const stateIsOrgId = state && /^[0-9a-f]{24}$/i.test(state);
    let orgId = stateIsOrgId ? state : null;

    const session = await getServerSession(authOptions);
    if (!orgId) orgId = session?.user?.orgId ?? null;

    const orgSlug = session?.user?.orgSlug ?? null;
    const base = process.env.ETSY_REDIRECT_BASE || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const redirectUri = `${base}/api/integrations/etsy/oauth/redirect`;

    try {
        const response = await fetch('https://api.etsy.com/v3/public/oauth/token', {
            method: 'POST',
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: clientID,
                redirect_uri: redirectUri,
                code,
                code_verifier: clientVerifier,
            }),
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        console.log("[Etsy OAuth] token exchange:", data.access_token ? "ok" : "failed", "orgId:", orgId);

        const shopRes = await axios.get("https://openapi.etsy.com/v3/application/users/me", {
            headers: {
                Authorization: `Bearer ${data.access_token}`,
                "x-api-key": process.env.etsyApiKey,
            },
        }).catch(e => { console.error("[Etsy OAuth] /users/me error:", e.response?.data); return null; });

        const findFilter = orgId
            ? { type: "etsy", orgId }
            : { type: "etsy", provider: orgSlug };
        let conn = await ApiKeyIntegrations.findOne(findFilter);
        if (conn) {
            conn.apiKey = data.access_token;
            conn.refreshToken = data.refresh_token;
            if (shopRes?.data) { conn.userId = shopRes.data.user_id; conn.shopId = shopRes.data.shop_id; }
            await conn.save();
        } else {
            conn = new ApiKeyIntegrations({
                apiKey: data.access_token,
                apiSecret: clientVerifier,
                organization: "admin",
                provider: orgSlug,
                orgId,
                type: "etsy",
                refreshToken: data.refresh_token,
                tokenType: "bearer",
                displayName: "Etsy Shop",
                userId: shopRes?.data?.user_id,
                shopId: shopRes?.data?.shop_id,
            });
            await conn.save();
        }

        const dest = orgSlug ? `${base}/${orgSlug}/integrations` : `${base}/integrations`;
        return NextResponse.redirect(dest);
    } catch (e) {
        console.error("[Etsy OAuth] error:", e);
        return Response.json({ error: e.toString() }, { status: 500 });
    }
}
