import axios from "axios";

// Bol.com Retailer API v10
// Docs: https://api.bol.com/retailer/public/Retailer-API/
// Auth: OAuth2 client credentials — token lasts ~5 min, reuse where possible

const TOKEN_URL = "https://login.bol.com/token";
const API_BASE  = "https://api.bol.com/retailer";

// connection.apiKey      = Client ID
// connection.refreshToken = Client Secret (stored in refreshToken field since bol uses client_credentials, no real refresh token)

async function getBolToken(connection) {
    const creds = Buffer.from(`${connection.apiKey}:${connection.refreshToken}`).toString("base64");
    const res = await axios.post(
        TOKEN_URL,
        new URLSearchParams({ grant_type: "client_credentials" }).toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${creds}`,
            },
        }
    );
    return res.data.access_token;
}

function bolHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.retailer.v10+json",
        "Content-Type": "application/vnd.retailer.v10+json",
    };
}

export async function getOrdersBol(connection) {
    const token = await getBolToken(connection);
    const res = await axios.get(`${API_BASE}/orders`, {
        headers: bolHeaders(token),
        params: { page: 1, "fulfilment-method": "FBR", status: "OPEN" },
    });
    return res.data?.orders ?? [];
}

export async function getOrderBol(connection, orderId) {
    const token = await getBolToken(connection);
    const res = await axios.get(`${API_BASE}/orders/${orderId}`, {
        headers: bolHeaders(token),
    });
    return res.data;
}

// Bol. shipments are created via POST /retailer/shipments (NOT per-order endpoint).
// orderItems is an array of orderItemId strings.
// transporterCode must be a bol.com carrier code: PostNL, DPD-NL, DHL, UPS, FEDEX-NL, GLS, TNT, etc.
// Response is 202 Accepted — bol. processes async. Returns processStatusId.
export async function shipOrderBol(connection, { trackingNumber, transporterCode, orderItems }) {
    const token = await getBolToken(connection);
    const body = {
        orderItems: (orderItems ?? []).map(id => ({ orderItemId: id, quantity: 1 })),
        transport: {
            transporterCode,
            trackAndTrace: trackingNumber,
        },
    };
    const res = await axios.post(`${API_BASE}/shipments`, body, {
        headers: bolHeaders(token),
    });
    // 202 response has processStatusId — caller can poll /process-status/{id} if needed
    return res.data ?? { ok: true };
}
