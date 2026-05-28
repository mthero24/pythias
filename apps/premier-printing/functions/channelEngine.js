const baseURL = () => {
    const url = process.env.ChannelEnginAPIURL || "";
    return url.endsWith("/") ? url.slice(0, -1) : url;
};

export class CEPermissionError extends Error {
    constructor(path) {
        super(`This API key does not have permission to access ${path}`);
        this.status = 403;
    }
}

async function ceRequest(path, options = {}) {
    const url = `${baseURL()}/${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            "X-CE-KEY": process.env.ChannelEnginAPIKey || "",
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        cache: "no-store",
    });
    const data = await res.json().catch(() => ({ Message: res.statusText }));
    if (res.status === 403) throw new CEPermissionError(path);
    if (!res.ok) throw new Error(`ChannelEngine ${options.method || "GET"} /${path}: ${res.status} — ${data?.Message || JSON.stringify(data)}`);
    return data;
}

export const getNewOrders = () => ceRequest("v2/orders/new");

export const acknowledgeOrders = (items) =>
    ceRequest("v2/orders/acknowledge", { method: "POST", body: JSON.stringify(items) });

export const listOrders = (params = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
    const qs = new URLSearchParams(filtered).toString();
    return ceRequest(`v2/orders${qs ? `?${qs}` : ""}`);
};

export const getOrder = (id) => ceRequest(`v2/orders/${id}`);

export const listProducts = (params = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
    const qs = new URLSearchParams(filtered).toString();
    return ceRequest(`v2/products${qs ? `?${qs}` : ""}`);
};

export const updateOffers = (offers) =>
    ceRequest("v2/offer", { method: "PUT", body: JSON.stringify(offers) });

export const createShipment = (shipment) =>
    ceRequest("v2/shipments", { method: "POST", body: JSON.stringify(shipment) });

export const listShipments = (params = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
    const qs = new URLSearchParams(filtered).toString();
    return ceRequest(`v2/shipments${qs ? `?${qs}` : ""}`);
};

export const listReturns = (params = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));
    const qs = new URLSearchParams(filtered).toString();
    return ceRequest(`v2/returns/merchant${qs ? `?${qs}` : ""}`);
};

export const getSettings = () => ceRequest("v2/settings");

export const listChannels = () => ceRequest("v2/channels");

// Update offers for a specific channel (CE channel-specific pricing)
export const updateChannelOffers = (channelId, offers) =>
    ceRequest(`v2/channels/${channelId}/offer`, { method: "PUT", body: JSON.stringify(offers) });
