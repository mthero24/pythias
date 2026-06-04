import { NextResponse } from "next/server";
import { TikTokAuth } from "@pythias/mongo";
import { getAccessTokenUsingAuthCode } from "@pythias/integrations";

const config = {
    app_key: process.env.tiktok_app_key || process.env.TIK_TOK_APP_KEY || process.env.Tik_Tok_AppKey,
    app_secret: process.env.tiktok_app_secret || process.env.Tik_Tok_AppSecret,
};

const PROVIDER_SUBDOMAINS = {
    premierPrinting: "simplysage",
    printthreads: "printthreads",
    "pythias-test": "test",
    test: "test",
};

export async function GET(req) {
    const code  = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    console.log("[TikTok OAuth] code:", code ? "present" : "MISSING", "state:", state, "config keys present:", !!config.app_key, !!config.app_secret);

    if (!code) return NextResponse.json({ error: true, msg: "Missing auth code" }, { status: 400 });

    let data;
    try {
        data = await getAccessTokenUsingAuthCode(config, code);
    } catch (e) {
        console.error("[TikTok OAuth] getAccessTokenUsingAuthCode failed:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }

    console.log("[TikTok OAuth] token exchange result:", JSON.stringify(data));

    let auth = null;

    // state is the pre-created TikTokAuth _id — use it to find the record with the correct provider
    if (state && /^[0-9a-f]{24}$/i.test(state)) {
        auth = await TikTokAuth.findById(state);
    }

    // fallback: match by seller_name returned from TikTok
    if (!auth) {
        auth = await TikTokAuth.findOne({ seller_name: data.seller_name });
    }

    if (auth) {
        const TOKEN_FIELDS = ["access_token", "access_token_expire_in", "refresh_token", "refresh_token_expire_in", "open_id", "granted_scopes", "seller_base_region", "user_type"];
        for (const key of TOKEN_FIELDS) { if (data[key] !== undefined) auth[key] = data[key]; }
        // store what TikTok says the seller is, but keep the user-entered seller_name as the identifier
        if (data.seller_name && data.seller_name !== auth.seller_name) {
            auth.tiktok_seller_name = data.seller_name;
        }
        auth.date = new Date();
        await auth.save();
    } else {
        auth = new TikTokAuth({ ...data, date: new Date() });
        await auth.save();
    }

    // Platform org — identified by orgId (new) or by provider not matching a known app (legacy)
    if (auth.orgId) {
        return NextResponse.redirect(
            `https://platform.pythiastechnologies.com/${auth.provider}/admin/integrations/tiktok`
        );
    }
    const subdomain = PROVIDER_SUBDOMAINS[auth.provider];
    if (subdomain) {
        return NextResponse.redirect(`https://${subdomain}.pythiastechnologies.com/admin/integrations`);
    }
    // Legacy platform org (no orgId stored) — provider is the slug
    return NextResponse.redirect(
        `https://platform.pythiastechnologies.com/${auth.provider}/admin/integrations/tiktok`
    );
}