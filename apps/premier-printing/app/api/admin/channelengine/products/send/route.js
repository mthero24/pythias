import { NextResponse } from "next/server";
import { listProducts, updateOffers } from "@/functions/channelEngine";

const SKIP_KEYS = new Set(["titleGenerator"]);

function buildCEProduct(product, blank, v, productOverrides, blankOverrides) {
    const item = {
        MerchantProductNo: v.sku,
        Name: [product.title || product.name, v.color?.name, v.size?.name].filter(Boolean).join(" - "),
        Description: product.description || "",
        Price: Number(v.price ?? v.size?.retailPrice ?? 0),
        Stock: 999,
        VATRateType: "STANDARD",
        GTIN: v.upc || undefined,
        ImageUrl: v.images?.[0] || product.productImages?.[0]?.image || undefined,
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

        const blank = product.blank ?? {};
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
        console.error("[channelengine/products/send]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
