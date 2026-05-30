import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { exchangeCodeEbay } from "@pythias/integrations";

const PROVIDER_SUBDOMAINS = {
    premierPrinting: "simplysage",
    printthreads:    "printthreads",
    "pythias-test":  "test",
    test:            "test",
    po:              "imperial",
};

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code  = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state") ?? "";

    // state: "<provider>" or "<provider>:sandbox"
    const [provider, mode] = state.split(":");
    const sandbox = mode === "sandbox";

    const subdomain = PROVIDER_SUBDOMAINS[provider] ?? "imperial";
    const adminUrl  = `https://${subdomain}.pythiastechnologies.com/admin/integrations`;

    if (error || !code) {
        console.error("[eBay OAuth] error:", error);
        return NextResponse.redirect(`${adminUrl}?error=ebay_auth_failed`);
    }


    try {
        const tokens = await exchangeCodeEbay(code, { sandbox });

        const existing = await ApiKeyIntegrations.findOne({ type: "ebay", provider, sandbox: !!sandbox });
        if (existing) {
            existing.apiKey = tokens.access_token;
            if (tokens.refresh_token) existing.refreshToken = tokens.refresh_token;
            await existing.save();
        } else {
            await new ApiKeyIntegrations({
                apiKey:            tokens.access_token,
                refreshToken:      tokens.refresh_token,
                tokenType:         "bearer",
                type:              "ebay",
                provider,
                sandbox:           !!sandbox,
                displayName:       `eBay Store${sandbox ? " (Sandbox)" : ""}`,
                organization:      "admin",
                pullOrdersEnabled: true,
            }).save();
        }

        return NextResponse.redirect(adminUrl);
    } catch (e) {
        const ebayBody = e.response?.data;
        console.error("[eBay OAuth] exchange error:", e.message, "eBay response:", JSON.stringify(ebayBody));
        return NextResponse.json({ error: e.toString(), ebay: ebayBody }, { status: 500 });
    }
}
