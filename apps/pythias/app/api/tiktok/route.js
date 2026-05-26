import { NextResponse } from "next/server";
import { TikTokAuth } from "@pythias/mongo";
import { getAccessTokenUsingAuthCode } from "@pythias/integrations";

const config = {
    app_key: process.env.tiktok_app_key,
    app_secret: process.env.tiktok_app_secret,
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

    let data = await getAccessTokenUsingAuthCode(config, code);

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

    const subdomain = PROVIDER_SUBDOMAINS[auth.provider] ?? "imperial";
    return NextResponse.redirect(
        `https://${subdomain}.pythiastechnologies.com/admin/integrations`
    );
}