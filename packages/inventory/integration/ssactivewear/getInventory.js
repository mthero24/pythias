import { ssClient } from "./client";

/**
 * Get real-time inventory for a style/color/size SKU.
 * Returns array of { sku, qty, warehouse } objects.
 */
export async function getSSInventory(style, credentials = {}) {
    const client = ssClient(credentials);
    const res = await client.get("/inventory/", {
        params: { style, fields: "sku,qty,warehouse" },
    });
    return res.data ?? [];
}
