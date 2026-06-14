import { NextResponse } from "next/server";
import { TikTokAuth, PlatformBlank } from "@pythias/mongo";
import { getAccessTokenFromRefreshToken, getAuthorizedShops } from "@pythias/integrations";
import { createTikTokListing, getTikTokAttributesForName } from "@/functions/tikTok";
import { getToken } from "next-auth/jwt";

const TOKEN_FIELDS = [
    "access_token", "access_token_expire_in", "refresh_token", "refresh_token_expire_in",
    "open_id", "granted_scopes", "seller_base_region", "user_type",
];

async function refreshCredentials(credId) {
    const credentials = await TikTokAuth.findById(credId);
    if (!credentials) return null;
    const tokens = await getAccessTokenFromRefreshToken(credentials.refresh_token);
    for (const key of TOKEN_FIELDS) {
        if (tokens[key] !== undefined) credentials[key] = tokens[key];
    }
    credentials.date = new Date();
    return credentials.save();
}

const hires = (url) => url?.replace(/(\?|&)width=\d+/, '$1width=2400') ?? url;

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: true, msg: "Invalid body" }, { status: 400 }); }

    const { product: p, connection, marketplaceName = null } = body;
    if (!p || !connection?._id) {
        return NextResponse.json({ error: true, msg: "Missing product or connection" }, { status: 400 });
    }

    let credentials = await TikTokAuth.findById(connection._id);
    if (!credentials) return NextResponse.json({ error: true, msg: "TikTok connection not found" }, { status: 404 });
    if (String(credentials.orgId) !== String(token.orgId)) {
        return NextResponse.json({ error: true, msg: "Connection does not belong to this organization" }, { status: 403 });
    }

    // Ensure shop_list is populated — required by all TikTok product API calls.
    if (!credentials.shop_list?.length) {
        let shopsRes = await getAuthorizedShops(credentials);
        if (shopsRes.error && shopsRes.msg === "refresh") {
            credentials = await refreshCredentials(credentials._id);
            shopsRes = await getAuthorizedShops(credentials);
        }
        if (shopsRes.error || !shopsRes.shop_list?.length) {
            return NextResponse.json({ error: true, msg: "No authorized TikTok shops found. Please reconnect." }, { status: 400 });
        }
        credentials.shop_list = shopsRes.shop_list;
        await credentials.save();
    }

    try {
        // Fetch the full blank from DB, then overlay any marketplace overrides / bullet points
        // the user set in the modal but didn't persist to the Blank document — otherwise the
        // DB copy silently discards those fresh selections.
        const blankId = p.blanks?.[0]?._id ?? p.blanks?.[0];
        const fullBlank = blankId ? await PlatformBlank.findById(blankId).lean() : null;
        const sentBlank = p.blanks?.[0] && typeof p.blanks[0] === "object" ? p.blanks[0] : null;
        const baseBlank = fullBlank ?? sentBlank;
        if (!baseBlank) return NextResponse.json({ error: true, msg: "Product blank not found" }, { status: 400 });
        const blankData = {
            ...baseBlank,
            marketPlaceOverrides: (() => {
                const dbOv = baseBlank.marketPlaceOverrides ?? {};
                const sentOv = sentBlank?.marketPlaceOverrides ?? {};
                const merged = { ...dbOv };
                for (const [mp, vals] of Object.entries(sentOv)) {
                    merged[mp] = { ...(dbOv[mp] ?? {}), ...(vals ?? {}) };
                }
                return merged;
            })(),
            bulletPoints: (sentBlank?.bulletPoints?.length ? sentBlank.bulletPoints : baseBlank.bulletPoints),
            sizeGuide: baseBlank.sizeGuide
                ? { ...baseBlank.sizeGuide, images: (baseBlank.sizeGuide.images ?? []).map(hires) }
                : undefined,
        };

        // Resolve the product-level marketplace values for this TikTok marketplace.
        const tiktokMp = (p.marketPlacesArray ?? []).find(m =>
            (m.name ?? "").toLowerCase() === (marketplaceName ?? "").toLowerCase()
        );
        const tiktokMpId = tiktokMp?._id?.toString() ?? tiktokMp?.toString();
        const marketplaceValues = (tiktokMpId && p.marketplaceValues?.[tiktokMpId])
            ? p.marketplaceValues[tiktokMpId]
            : {};

        const product = {
            name:          p.title,
            brand:         p.brand ?? null,
            description:   p.description,
            tags:          p.tags ?? [],
            design:        p.design,
            blank:         blankData,
            images:        (p.productImages ?? []).map(pi => hires(pi.image)).filter(Boolean),
            variants:      (p.variantsArray ?? []).map(v => ({
                color:  v.color,
                size:   v.size?.name ?? v.size,
                sku:    v.sku,
                upc:    v.upc,
                price:  v.price,
                images: [v.image, ...(v.images ?? [])].filter(Boolean).map(hires),
            })),
            marketplaceValues,
            packageLength: p.packageLength ?? null,
            packageWidth:  p.packageWidth  ?? null,
            packageHeight: p.packageHeight ?? null,
        };

        const result = await createTikTokListing({ product, credentials, marketplaceName });
        return NextResponse.json({ error: false, tiktokProductId: result?.tiktokProductId, warning: result?.warning ?? null });
    } catch (e) {
        console.error("[TikTok listing]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

// Powers the "TikTok Attribute Reference" dialog in the shared MarketPlaceModal.
export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("productName") || "t-shirt";

    let credentials = await TikTokAuth.findOne({ orgId: token.orgId });
    if (!credentials) return NextResponse.json({ error: true, msg: "No TikTok connection found for this organization" }, { status: 404 });

    let result = await getTikTokAttributesForName(productName, credentials);
    if (result.error && result.msg === "refresh") {
        credentials = await refreshCredentials(credentials._id);
        result = await getTikTokAttributesForName(productName, credentials);
    }
    if (result.error) return NextResponse.json({ error: true, msg: result.msg }, { status: 400 });
    return NextResponse.json(result);
}
