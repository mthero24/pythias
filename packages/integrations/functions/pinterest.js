import axios from "axios";

const BASE_URL = "https://api.pinterest.com/v5";

const pinterestRequest = async (method, path, data, credentials) => {
    try {
        const res = await axios({
            method,
            url: `${BASE_URL}${path}`,
            headers: {
                "Authorization": `Bearer ${credentials.apiKey}`,
                "Content-Type": "application/json",
            },
            ...(method === "GET" ? { params: data } : { data }),
        });
        return res.data;
    } catch (e) {
        const msg = e.response?.data?.message ?? e.response?.data?.code ?? e.message;
        throw new Error(`Pinterest API ${method} ${path}: ${msg}`);
    }
};

// Pinterest has no order fulfillment API — orders happen on the merchant's site.
// This integration is catalog-only: push products to Pinterest Shopping.
export const createPinterestCatalogItems = async (product, credentials) => {
    const catalogId = credentials.shopId;
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    const items = product.variantsArray.map(v => ({
        item_id: v.sku,
        operation: "CREATE",
        attributes: {
            id: v.sku,
            title: product.name,
            description: product.description ?? "",
            link: `https://example.com/products/${product._id}`,
            image_link: [v.image ?? product.variantsArray[0]?.image ?? ""].filter(Boolean),
            price: `${parseFloat(v.price ?? basePrice ?? 0).toFixed(2)} USD`,
            availability: "in stock",
            condition: "new",
            item_group_id: product._id?.toString(),
        },
    }));

    // Endpoint: POST /catalogs/{catalog_id}/items/batch
    const res = await pinterestRequest("POST", `/catalogs/${catalogId}/items/batch`, {
        catalog_type: "RETAIL",
        country: "US",
        language: "EN",
        items,
    }, credentials);
    return { batchId: res.batch_id, catalogId };
};

export const updatePinterestCatalogItems = async (pinterestBatchId, product, credentials) => {
    const catalogId = credentials.shopId;
    const basePrice = Math.min(...product.variantsArray.map(v => parseFloat(v.price ?? 0)).filter(p => p > 0));
    const res = await pinterestRequest("POST", `/catalogs/${catalogId}/items/batch`, {
        catalog_type: "RETAIL",
        country: "US",
        language: "EN",
        items: product.variantsArray.map(v => ({
            item_id: v.sku,
            operation: "UPDATE",
            update_mask: ["title", "description", "price"],
            attributes: {
                id: v.sku,
                title: product.name,
                description: product.description ?? "",
                link: `https://example.com/products/${product._id}`,
                image_link: [v.image ?? ""].filter(Boolean),
                price: `${parseFloat(v.price ?? basePrice ?? 0).toFixed(2)} USD`,
                availability: "in stock",
            },
        })),
    }, credentials);
    return { batchId: res.batch_id };
};
