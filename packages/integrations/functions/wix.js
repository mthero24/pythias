import axios from "axios";

const BASE_URL = "https://www.wixapis.com";

const wixRequest = async (method, path, data, credentials) => {
    const headers = {
        "Authorization": credentials.apiKey,
        "Content-Type": "application/json",
    };
    if (credentials.shopId) headers["wix-site-id"] = credentials.shopId;
    try {
        const res = await axios({ method, url: `${BASE_URL}${path}`, headers, data });
        return res.data;
    } catch (e) {
        const msg = e.response?.data?.message ?? e.response?.data?.error ?? e.message;
        throw new Error(`Wix API ${method.toUpperCase()} ${path}: ${msg}`);
    }
};

export const createWixProduct = async (product, credentials) => {
    const colors = [...new Set(product.variantsArray.map(v => v.color?.name).filter(Boolean))];
    const sizes  = [...new Set(product.variantsArray.map(v => {
        const sizeObj = product.sizes?.find(s => s._id?.toLowerCase() === v.size?.toLowerCase());
        return sizeObj?.name ?? v.size;
    }).filter(Boolean))];

    const options = [];
    if (colors.length > 0) options.push({ name: "Color", choices: colors.map(c => ({ value: c })) });
    if (sizes.length  > 0) options.push({ name: "Size",  choices: sizes.map(s => ({ value: s })) });

    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));

    const payload = {
        product: {
            name: product.name,
            description: product.description ?? "",
            productType: "physical",
            priceData: { price: basePrice || 0 },
            visible: true,
            ...(options.length ? { options } : {}),
        },
    };

    const res = await wixRequest("POST", "/stores/v1/products", payload, credentials);
    const wixProduct = res.product;

    // Add images (de-duped variant main images)
    const imageUrls = [...new Set(product.variantsArray.map(v => v.image).filter(Boolean))].slice(0, 8);
    if (imageUrls.length) {
        try {
            await wixRequest("POST", `/stores/v1/products/${wixProduct.id}/media`, {
                media: imageUrls.map(url => ({ url, mediaType: "IMAGE" })),
            }, credentials);
        } catch (e) {
            console.log("[Wix] image upload failed:", e.message);
        }
    }

    // Update variant SKUs and per-variant prices
    if (wixProduct.variants?.length) {
        const variantUpdates = wixProduct.variants.map(wv => {
            const colorChoice = wv.choices?.Color ?? "";
            const sizeChoice  = wv.choices?.Size  ?? "";
            const match = product.variantsArray.find(v => {
                const c = v.color?.name ?? "";
                const sizeObj = product.sizes?.find(s => s._id?.toLowerCase() === v.size?.toLowerCase());
                const sz = sizeObj?.name ?? v.size ?? "";
                return (!colorChoice || c === colorChoice) && (!sizeChoice || sz === sizeChoice);
            });
            return {
                id: wv.id,
                variant: {
                    sku: match?.sku ?? "",
                    priceData: { price: parseFloat(match?.price ?? basePrice ?? 0) },
                    visible: true,
                },
            };
        });
        try {
            await wixRequest("PATCH", `/stores/v1/products/${wixProduct.id}/variants`, { variants: variantUpdates }, credentials);
        } catch (e) {
            console.log("[Wix] variant update failed:", e.message);
        }

        // Merge the SKUs we just PATCHed into the returned variants so the caller can match them
        const mergedVariants = wixProduct.variants.map(wv => {
            const upd = variantUpdates.find(u => u.id === wv.id);
            return upd ? { ...wv, variant: { ...(wv.variant ?? {}), sku: upd.variant.sku } } : wv;
        });
        return { ...wixProduct, variants: mergedVariants };
    }

    return wixProduct;
};

export const updateWixProduct = async (wixProductId, product, credentials) => {
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    await wixRequest("PUT", `/stores/v1/products/${wixProductId}`, {
        product: {
            name: product.name,
            description: product.description ?? "",
            priceData: { price: basePrice || 0 },
        },
    }, credentials);
    return { id: wixProductId };
};

export const getWixOrders = async (credentials, cursor) => {
    const payload = {
        search: {
            filter: { paymentStatus: { $in: ["PAID", "PARTIALLY_PAID"] } },
            cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) },
            sort: [{ fieldName: "createdDate", order: "DESC" }],
        },
    };
    return await wixRequest("POST", "/ecom/v1/orders/search", payload, credentials);
};
