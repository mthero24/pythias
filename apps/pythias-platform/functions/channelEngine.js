// Platform version: credentials passed in rather than read from env
export class CEPermissionError extends Error {
    constructor(path) {
        super(`This API key does not have permission to access ${path}`);
        this.status = 403;
    }
}

function makeClient(apiUrl, apiKey) {
    const base = apiUrl?.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl ?? "";
    return async function ceRequest(path, options = {}) {
        const res = await fetch(`${base}/${path}`, {
            ...options,
            headers: {
                "X-CE-KEY": apiKey ?? "",
                "Content-Type": "application/json",
                ...(options.headers ?? {}),
            },
            cache: "no-store",
        });
        const data = await res.json().catch(() => ({ Message: res.statusText }));
        if (res.status === 403) throw new CEPermissionError(path);
        if (!res.ok) throw new Error(`ChannelEngine ${options.method ?? "GET"} /${path}: ${res.status} — ${data?.Message ?? JSON.stringify(data)}`);
        return data;
    };
}

export function createCEClient(apiUrl, apiKey) {
    const req = makeClient(apiUrl, apiKey);
    return {
        getNewOrders: () => req("v2/orders/new"),
        acknowledgeOrders: (items) => req("v2/orders/acknowledge", { method: "POST", body: JSON.stringify(items) }),
        listOrders: (params = {}) => {
            const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))).toString();
            return req(`v2/orders${qs ? `?${qs}` : ""}`);
        },
        getOrder: (id) => req(`v2/orders/${id}`),
        createShipment: (shipment) => req("v2/shipments", { method: "POST", body: JSON.stringify(shipment) }),
        listShipments: (params = {}) => {
            const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))).toString();
            return req(`v2/shipments${qs ? `?${qs}` : ""}`);
        },
        updateOffers: (offers) => req("v2/offer", { method: "PUT", body: JSON.stringify(offers) }),
        listProducts: (params = {}) => {
            const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))).toString();
            return req(`v2/products${qs ? `?${qs}` : ""}`);
        },
        listReturns: (params = {}) => {
            const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""))).toString();
            return req(`v2/returns/merchant${qs ? `?${qs}` : ""}`);
        },
        getSettings: () => req("v2/settings"),
        listChannels: () => req("v2/channels"),
    };
}
