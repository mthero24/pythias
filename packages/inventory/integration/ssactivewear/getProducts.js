import { ssClient } from "./client";

/**
 * Fetch product info by style code (e.g. "PC61").
 * Returns array of product variants with sku, color, size, pricing, inventory.
 */
export async function getSSProducts(style, credentials = {}) {
    const client = ssClient(credentials);
    const res = await client.get("/products/", {
        params: {
            style,
            fields: "sku,gtin,colorName,sizeName,piecePrice,customerPrice,salePrice,qty,styleID,partNumber,brandName,title",
        },
    });
    return res.data ?? [];
}

/**
 * Test credentials by fetching a known style. Returns true if valid.
 */
export async function testSSCredentials(credentials) {
    try {
        const products = await getSSProducts("PC61", credentials);
        return Array.isArray(products) && products.length > 0;
    } catch {
        return false;
    }
}
