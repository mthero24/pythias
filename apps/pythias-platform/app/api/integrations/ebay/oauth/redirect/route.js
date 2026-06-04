import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { exchangeCodeEbay } from "@pythias/integrations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3006";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code  = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error || !code) {
        return NextResponse.redirect(`${BASE}/integrations?error=ebay_auth_failed`);
    }

    // state was encoded as "<orgId>" or "<orgId>:sandbox" in the init route
    const [rawOrgId, sandboxFlag] = (state ?? "").split(":");
    const stateIsOrgId = rawOrgId && /^[0-9a-f]{24}$/i.test(rawOrgId);
    let orgId = stateIsOrgId ? rawOrgId : null;
    const sandbox = sandboxFlag === "sandbox";

    // Fall back to session if state didn't carry orgId
    const session = await getServerSession(authOptions);
    if (!orgId) orgId = session?.user?.orgId ?? null;
    const orgSlug = session?.user?.orgSlug ?? null;

    try {
        const tokens = await exchangeCodeEbay(code, { sandbox });
        const findFilter = orgId
            ? { type: "ebay", orgId }
            : { type: "ebay", provider: orgSlug };
        let conn = await ApiKeyIntegrations.findOne(findFilter);
        if (conn) {
            conn.apiKey = tokens.access_token;
            conn.refreshToken = tokens.refresh_token;
            conn.sandbox = sandbox;
            await conn.save();
        } else {
            conn = new ApiKeyIntegrations({
                apiKey:       tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenType:    "bearer",
                type:         "ebay",
                provider:     orgSlug,
                orgId,
                displayName:  "eBay Store",
                organization: "admin",
                sandbox,
                pullOrdersEnabled: true,
            });
            await conn.save();
        }

        const dest = orgSlug ? `${BASE}/${orgSlug}/integrations` : `${BASE}/integrations`;
        return NextResponse.redirect(dest);
    } catch (e) {
        console.error("[eBay OAuth] error:", e);
        return NextResponse.json({ error: e.toString() }, { status: 500 });
    }
}
