import axios from "axios";

// Noon Seller API
// IMPORTANT: Noon's API documentation is not publicly accessible.
// To get the actual endpoint paths and authentication details, contact: seller@noon.com
// Or log in to https://noon-docs.noonpartners.dev/ with your seller account.
//
// What is known:
//   - Auth: Bearer JWT token, generated from a service account in Noon Partner Dashboard
//     (Settings → API Settings → Create API user with account type "apijwt")
//   - The endpoints below are based on published integration guides and may need adjustment.
//   - connection.apiKey      = JWT token (or a service account key that generates one)
//   - connection.organization = country store (e.g. "ae", "sa", "eg")

const API_BASE = "https://api.noon.com/seller-center";

function noonHeaders(connection) {
    return {
        Authorization: `Bearer ${connection.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };
}

export async function getOrdersNoon(connection) {
    try {
        const res = await axios.get(`${API_BASE}/v2/orders`, {
            headers: noonHeaders(connection),
            params: { status: "New" },
        });
        return res.data?.orders ?? res.data?.data ?? [];
    } catch (e) {
        console.error("[Noon] getOrders error:", e.response?.data ?? e.message);
        throw new Error(e.response?.data?.message ?? e.message);
    }
}

export async function shipOrderNoon(connection, orderId, { trackingNumber, carrier }) {
    try {
        const res = await axios.post(`${API_BASE}/v2/shipments`, {
            order_id:        orderId,
            tracking_number: trackingNumber,
            shipping_carrier: carrier,
        }, { headers: noonHeaders(connection) });
        return res.data ?? { ok: true };
    } catch (e) {
        console.error("[Noon] shipOrder error:", e.response?.data ?? e.message);
        throw new Error(e.response?.data?.message ?? e.message);
    }
}
