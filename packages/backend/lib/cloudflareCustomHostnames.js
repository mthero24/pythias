// Cloudflare for SaaS — Custom Hostnames API client.
// Lets a seller connect their own domain (e.g. shop.acmebrand.com) to their Pythias
// storefront: we register the hostname with Cloudflare, Cloudflare issues + auto-renews
// the edge SSL cert, and routes the domain to our fallback origin. We just create the
// hostname and poll its status. Server-only.
//
// Reuses the existing Cloudflare credentials (note the pre-existing capitalization quirk
// in the env var names — kept as-is so we don't fork config):
//   CloudFlare_Token   — API token; MUST have "SSL and Certificates: Edit" (custom hostnames)
//   CLoudFlare_ZoneId  — the pythiastechnologies.com zone id
const CF_API = "https://api.cloudflare.com/client/v4";

function cfEnv() {
    const token = process.env.CloudFlare_Token;
    const zone = process.env.CLoudFlare_ZoneId;
    if (!token || !zone) {
        const e = new Error("Cloudflare is not configured (CloudFlare_Token / CLoudFlare_ZoneId).");
        e.status = 503;
        throw e;
    }
    return { token, zone };
}

async function cf(path, { method = "GET", body } = {}) {
    const { token, zone } = cfEnv();
    const res = await fetch(`${CF_API}/zones/${zone}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
        const msg = json?.errors?.[0]?.message || `Cloudflare API error (${res.status})`;
        const e = new Error(msg);
        e.status = res.status === 429 ? 429 : 502;
        e.cf = json?.errors;
        throw e;
    }
    return json.result;
}

// Create a custom hostname. HTTP DCV → once the seller's CNAME points into our zone,
// Cloudflare validates domain control and issues the SSL cert automatically.
export function createCustomHostname(hostname) {
    return cf("/custom_hostnames", {
        method: "POST",
        body: { hostname, ssl: { method: "http", type: "dv", settings: { min_tls_version: "1.2" } } },
    });
}

export function getCustomHostname(id) {
    return cf(`/custom_hostnames/${id}`);
}

export function deleteCustomHostname(id) {
    return cf(`/custom_hostnames/${id}`, { method: "DELETE" });
}

// One-time setup: point all custom hostnames at our origin. `origin` is a proxied DNS
// record in the zone that resolves to the storefront server (e.g. store.pythiastechnologies.com).
export function setFallbackOrigin(origin) {
    return cf("/custom_hostnames/fallback_origin", { method: "PUT", body: { origin } });
}

// Collapse Cloudflare's hostname + ssl status into our pending | active | failed.
export function mapHostnameStatus(result) {
    const ssl = result?.ssl?.status;
    const host = result?.status;
    if (host === "active" && ssl === "active") return "active";
    if (ssl === "validation_timed_out" || host === "moved" || host === "deleted") return "failed";
    return "pending";
}
