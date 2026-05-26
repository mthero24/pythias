import axios from "axios";

const wooRequest = async (method, path, data, credentials) => {
    const base = (credentials.shopId ?? "").replace(/\/$/, "");
    const url = `${base}/wp-json/wc/v3${path}`;
    const auth = { username: credentials.apiKey, password: credentials.apiSecret };
    try {
        const res = await axios({
            method, url, auth,
            ...(method === "GET" ? { params: data } : { data }),
        });
        return res.data;
    } catch (e) {
        const msg = e.response?.data?.message ?? e.response?.data?.error ?? e.message;
        throw new Error(`WooCommerce ${method.toUpperCase()} ${path}: ${msg}`);
    }
};

export const createWooProduct = async (product, credentials) => {
    const colors = [...new Set(product.variantsArray.map(v => v.color?.name).filter(Boolean))];
    const sizes  = [...new Set(product.variantsArray.map(v => {
        const sizeObj = product.sizes?.find(s => s._id?.toLowerCase() === v.size?.toLowerCase());
        return sizeObj?.name ?? v.size;
    }).filter(Boolean))];

    const attributes = [];
    if (colors.length > 0) attributes.push({ name: "Color", visible: true, variation: true, options: colors });
    if (sizes.length  > 0) attributes.push({ name: "Size",  visible: true, variation: true, options: sizes  });

    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0)) || 0;

    const payload = {
        name: product.name,
        type: attributes.length ? "variable" : "simple",
        description: product.description ?? "",
        status: "publish",
        ...(attributes.length ? { attributes } : {
            regular_price: String(basePrice),
            sku: product.variantsArray[0]?.sku ?? "",
        }),
    };

    const wooProduct = await wooRequest("POST", "/products", payload, credentials);

    // Upload images
    const imageUrls = [...new Set(product.variantsArray.map(v => v.image).filter(Boolean))].slice(0, 8);
    if (imageUrls.length) {
        try {
            await wooRequest("PUT", `/products/${wooProduct.id}`, {
                images: imageUrls.map(src => ({ src })),
            }, credentials);
        } catch (e) {
            console.log("[WooCommerce] image update failed:", e.message);
        }
    }

    // Batch-create variations
    if (attributes.length && product.variantsArray.length) {
        const variations = product.variantsArray.map(v => {
            const sizeObj  = product.sizes?.find(s => s._id?.toLowerCase() === v.size?.toLowerCase());
            const sizeVal  = sizeObj?.name ?? v.size ?? "";
            const colorVal = v.color?.name ?? "";
            const varAttrs = [];
            if (colorVal) varAttrs.push({ name: "Color", option: colorVal });
            if (sizeVal)  varAttrs.push({ name: "Size",  option: sizeVal  });
            return {
                sku: v.sku ?? "",
                regular_price: String(parseFloat(v.price ?? basePrice)),
                attributes: varAttrs,
                ...(v.image ? { image: { src: v.image } } : {}),
                status: "publish",
            };
        });

        try {
            const batchRes = await wooRequest("POST", `/products/${wooProduct.id}/variations/batch`, { create: variations }, credentials);
            wooProduct._createdVariations = batchRes.create ?? [];
        } catch (e) {
            console.log("[WooCommerce] variation batch failed:", e.message);
        }
    }

    return wooProduct;
};

export const updateWooProduct = async (wooProductId, product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0)) || 0;
    await wooRequest("PUT", `/products/${wooProductId}`, {
        name: product.name,
        description: product.description ?? "",
    }, credentials);
    return { id: wooProductId };
};

export const getWooOrders = async (credentials, page = 1) => {
    const orders = await wooRequest("GET", "/orders", { status: "processing", per_page: 100, page }, credentials);
    return { orders: Array.isArray(orders) ? orders : [] };
};
