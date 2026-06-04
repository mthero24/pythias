import { NextResponse } from "next/server";
import { TikTokAuth } from "@pythias/mongo";
import {
    getAccessTokenFromRefreshToken,
    getAuthorizedShops,
    uploadProductImage,
    getRecommendedCategory,
    getWarehouses,
    getAttributes,
    createProduct,
} from "@pythias/integrations";
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

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: true, msg: "Invalid body" }, { status: 400 }); }

    const { product, connection } = body;
    if (!product || !connection?._id) {
        return NextResponse.json({ error: true, msg: "Missing product or connection" }, { status: 400 });
    }

    let credentials = await TikTokAuth.findById(connection._id);
    if (!credentials) return NextResponse.json({ error: true, msg: "TikTok connection not found" }, { status: 404 });

    // Ensure shop_list is populated — required by all TikTok API calls
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
        // Get category
        let categories = await getRecommendedCategory(product.title, credentials);
        if (categories?.error && categories.msg === "refresh") {
            credentials = await refreshCredentials(credentials._id);
            if (shopCipher) credentials.shop_cipher = shopCipher;
            categories = await getRecommendedCategory(product.title, credentials);
        }
        const categoryId = categories?.categories?.find(c => c.is_leaf)?.id;
        if (!categoryId) return NextResponse.json({ error: true, msg: "Could not determine TikTok category" }, { status: 400 });

        // Get warehouses
        let warehouses = await getWarehouses(credentials);
        if (warehouses?.error && warehouses.msg === "refresh") {
            credentials = await refreshCredentials(credentials._id);
            if (shopCipher) credentials.shop_cipher = shopCipher;
            warehouses = await getWarehouses(credentials);
        }
        const warehouse = warehouses?.warehouses?.find(w => w.is_default);
        if (!warehouse) return NextResponse.json({ error: true, msg: "No default TikTok warehouse found" }, { status: 400 });

        // Collect unique main images across all variants (max 9)
        const mainImageUrls = [];
        for (const v of (product.variantsArray ?? [])) {
            for (const img of [v.image, ...(v.images ?? [])].filter(Boolean)) {
                if (!mainImageUrls.includes(img) && mainImageUrls.length < 9) mainImageUrls.push(img);
            }
        }

        // Upload main images
        const mainImages = [];
        for (const url of mainImageUrls) {
            const res = await uploadProductImage(url, credentials, "MAIN_IMAGE");
            if (!res.error) mainImages.push({ uri: res.uri });
        }

        // Build SKUs from variants
        const skus = [];
        for (const v of (product.variantsArray ?? [])) {
            const colorName = v.color?.name ?? v.colorName ?? "";
            const sizeName = typeof v.size === "string" ? v.size : (v.size?.name ?? "");
            const attributes = [];

            // Upload variant image
            let mainImage;
            const varImgUrls = [v.image, ...(v.images ?? [])].filter(Boolean).slice(0, 3);
            for (const imgUrl of varImgUrls) {
                const res = await uploadProductImage(imgUrl, credentials, "MAIN_IMAGE");
                if (!res.error && !mainImage) mainImage = { uri: res.uri };
            }

            if (colorName) attributes.push({ name: "Color", value_name: colorName, ...(mainImage ? { sku_img: mainImage } : {}) });
            if (sizeName) attributes.push({ name: "Size", value_name: sizeName });

            const sku = {
                sales_attributes: attributes,
                inventory: [{ warehouse_id: warehouse.id, quantity: 1000 }],
                seller_sku: v.sku,
                price: { amount: `${(v.price ?? 0).toFixed(2)}`, currency: "USD" },
            };
            if (v.upc) sku.identifier_code = { code: v.upc, type: "UPC" };
            skus.push(sku);
        }

        // Get category attributes for required compliance fields
        let attributesRes = await getAttributes(categoryId, credentials);
        if (attributesRes?.error && attributesRes.msg === "refresh") {
            credentials = await refreshCredentials(credentials._id);
            if (shopCipher) credentials.shop_cipher = shopCipher;
            attributesRes = await getAttributes(categoryId, credentials);
        }
        const productAttributes = [];
        if (attributesRes?.attributes) {
            const caCarcinogens = attributesRes.attributes.find(a => a.name === "CA Prop 65: Carcinogens");
            const caRepro = attributesRes.attributes.find(a => a.name === "CA Prop 65: Repro. Chems");
            if (caCarcinogens) productAttributes.push({ id: caCarcinogens.id, values: [{ id: "1000059", name: "No" }] });
            if (caRepro) productAttributes.push({ id: caRepro.id, values: [{ id: "1000059", name: "No" }] });

            const regionOfOrigin = attributesRes.attributes.find(a => a.id === "100336" || a.name === "Region Of Origin");
            if (regionOfOrigin) {
                const usValue = regionOfOrigin.values?.find(v =>
                    /united states/i.test(v.name) || /\bus\b/i.test(v.name) || /\busa\b/i.test(v.name)
                );
                const value = usValue ?? regionOfOrigin.values?.[0];
                if (value) productAttributes.push({ id: regionOfOrigin.id, values: [{ id: value.id, name: value.name }] });
            }

            const recommendedAge = attributesRes.attributes.find(a => a.id === "100433" || a.name === "Recommended Age");
            if (recommendedAge) {
                const kidsValue = recommendedAge.values?.find(v =>
                    /2.?14/i.test(v.name) || /3.?14/i.test(v.name) || /kids/i.test(v.name) || /child/i.test(v.name)
                );
                const value = kidsValue ?? recommendedAge.values?.[0];
                if (value) {
                    console.log("[TikTok] Recommended Age attribute values:", recommendedAge.values?.map(v => `${v.id}:${v.name}`));
                    productAttributes.push({ id: recommendedAge.id, values: [{ id: value.id, name: value.name }] });
                }
            }
        }

        const tiktokProduct = {
            save_mode: "LISTING",
            title: product.title,
            description: product.description || product.title,
            is_cod_allowed: false,
            package_dimensions: { length: "13", height: "1", width: "10", unit: "INCH" },
            package_weight: { value: "0.50", unit: "POUND" },
            main_images: mainImages,
            skus,
            category_id: categoryId,
            category_version: "v2",
            idempotency_key: product.sku || product._id?.toString(),
            product_attributes: productAttributes,
        };

        let result = await createProduct({ tiktokProduct, credentials });
        if (result?.error && result.msg === "refresh") {
            credentials = await refreshCredentials(credentials._id);
            if (shopCipher) credentials.shop_cipher = shopCipher;
            result = await createProduct({ tiktokProduct, credentials });
        }

        if (result?.error) {
            return NextResponse.json({ error: true, msg: result.msg ?? "TikTok product creation failed" }, { status: 400 });
        }

        return NextResponse.json({ error: false, tiktokProductId: result?.product?.product_id });
    } catch (e) {
        console.error("[TikTok listing]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
