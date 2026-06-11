import { ssClient } from "./client";

/**
 * Submit a purchase order to SS Activewear.
 * lineItems = [{ sku, qty }]  — sku is the SS Activewear SKU (style-color-size format)
 * shipTo    = { address, city, state, zip, country? }
 * Returns { error, orderNumbers: [], message }
 * Note: SS returns one order per warehouse when items ship from multiple locations.
 */
export async function submitSSOrder(poNumber, lineItems, shipTo, credentials = {}, opts = {}) {
    const client = ssClient(credentials);

    const payload = {
        poNumber,
        shippingAddress: {
            address: shipTo.address || "",
            city:    shipTo.city    || "",
            state:   shipTo.state   || "",
            zip:     shipTo.zip     || "",
        },
        lines: lineItems.map(item => ({
            identifier: item.sku,
            qty:        item.qty,
        })),
        ...(opts.emailConfirmation ? { emailConfirmation: opts.emailConfirmation } : {}),
        ...(opts.testOrder         ? { testOrder: true }                           : {}),
    };

    try {
        const res = await client.post("/orders/", payload);
        const orders = Array.isArray(res.data) ? res.data : [res.data];
        const orderNumbers = orders.map(o => o.orderNumber || o.OrderNumber).filter(Boolean);
        return { error: false, orderNumbers, message: `Order(s) created: ${orderNumbers.join(", ")}` };
    } catch (err) {
        const msg = err.response?.data?.message || err.response?.data || err.message || "Order failed";
        return { error: true, orderNumbers: [], message: typeof msg === "string" ? msg : JSON.stringify(msg) };
    }
}

/**
 * Test an order without submitting (testOrder: true).
 */
export async function preSubmitSSOrder(poNumber, lineItems, shipTo, credentials = {}) {
    return submitSSOrder(poNumber, lineItems, shipTo, credentials, { testOrder: true });
}
