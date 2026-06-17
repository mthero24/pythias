import { NextResponse } from "next/server";
import { logError } from "@pythias/backend/server";
import { listProducts, updateOffers } from "@/functions/channelEngine";

const SKIP_KEYS = new Set(["titleGenerator"]);

function buildCEProduct(product, blank, v, productOverrides, blankOverrides) {
    // Resolve size: variantsArray.size is an ObjectId string; look it up in blank.sizes
    const sizeObj  = (blank?.sizes ?? []).find(s => s._id?.toString() === String(v.size))
        ?? (typeof v.size === "object" ? v.size : null);
    const sizeName  = sizeObj?.name ?? (typeof v.size === "string" && v.size.length < 30 ? v.size : null);
    const sizePrice = sizeObj?.retailPrice;
    const colorName = v.color?.name ?? null;
    const gtin      = v.upc || v.gtin || null;
    const parentSku = product.sku || product._id?.toString() || undefined;

    const item = {
        MerchantProductNo:       v.sku,
        ParentMerchantProductNo: parentSku,
        Name: [product.title || product.name, colorName, sizeName].filter(Boolean).join(" - "),
        Description: product.description || "",
        Price: Number(v.price ?? sizePrice ?? 0),
        CatalogPrice: Number(v.price ?? sizePrice ?? 0),
        Stock: 999,
        VATRateType: "STANDARD",
        GTIN:  gtin      || undefined,
        Color: colorName || undefined,
        Size:  sizeName  || undefined,
        ImageUrl: v.images?.[0] || v.image || product.productImages?.[0]?.image || undefined,
    };

    if (Object.keys(blankOverrides).length > 0) Object.assign(item, blankOverrides);
    for (const [k, v2] of Object.entries(productOverrides)) {
        if (!SKIP_KEYS.has(k) && v2 !== "" && v2 != null) item[k] = v2;
    }

    return item;
}

// POST /api/admin/channelengine/products/send
// Body: { product } — a pythias product object
export async function POST(req) {
    try {
        const { product, connectionId } = await req.json();
        if (!product) return NextResponse.json({ error: true, msg: "product is required" }, { status: 400 });

        const blank = product.blank ?? product.blanks?.[0] ?? {};
        const blankOverrides = blank?.marketPlaceOverrides?.["ChannelEngine"]
            ?? blank?.marketPlaceOverrides?.["channelengine"]
            ?? {};
        const resolvedId = connectionId ?? "channelengine";
        const productOverrides = Object.fromEntries(
            Object.entries(product.marketplaceValues?.[resolvedId] ?? product.marketplaceValues?.["ChannelEngine"] ?? {})
                .filter(([k, v]) => !SKIP_KEYS.has(k) && v !== "" && v != null)
        );

        const variants = product.variantsArray ?? [];
        const results = [];

        if (variants.length > 0) {
            const offers = variants
                .filter(v => v.sku)
                .map(v => buildCEProduct(product, blank, v, productOverrides, blankOverrides));

            if (offers.length > 0) {
                const res = await fetch(
                    `${(process.env.ChannelEnginAPIURL || "").replace(/\/$/, "")}/v2/products`,
                    {
                        method: "POST",
                        headers: { "X-CE-KEY": process.env.ChannelEnginAPIKey || "", "Content-Type": "application/json" },
                        body: JSON.stringify(offers),
                        cache: "no-store",
                    }
                );
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.Message || `CE ${res.status}`);
                const items = Array.isArray(data?.Content) ? data.Content : Array.isArray(data) ? data : [];
results.push(...items);
            }
        } else {
            const sku = product.sku || product._id?.toString();
            const item = {
                MerchantProductNo: sku,
                Name: product.title || product.name || sku,
                Description: product.description || "",
                Price: 0,
                Stock: 999,
                VATRateType: "STANDARD",
                ImageUrl: product.productImages?.[0]?.image || undefined,
            };
            if (Object.keys(blankOverrides).length > 0) Object.assign(item, blankOverrides);
            for (const [k, v2] of Object.entries(productOverrides)) {
                if (!SKIP_KEYS.has(k) && v2 !== "" && v2 != null) item[k] = v2;
            }
            const offer = [item];
            const res = await fetch(
                `${(process.env.ChannelEnginAPIURL || "").replace(/\/$/, "")}/v2/products`,
                {
                    method: "POST",
                    headers: { "X-CE-KEY": process.env.ChannelEnginAPIKey || "", "Content-Type": "application/json" },
                    body: JSON.stringify(offer),
                    cache: "no-store",
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.Message || `CE ${res.status}`);
            const items = Array.isArray(data?.Content) ? data.Content : Array.isArray(data) ? data : [];
results.push(...items);
        }

        return NextResponse.json({ error: false, channelEngineProductId: product.sku || product._id?.toString(), results });
    } catch (e) {
        logError({ error: e, app: "platform", provider: "platform", source: "POST /api/admin/channelengine/products/send", context: { channel: "channelengine", op: "send" } });
        console.error("[channelengine/products/send]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
