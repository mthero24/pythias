// Daily: pull Google Ads spend into channel ROI for every connected storefront.
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const env = readEnv(path.join(ROOT, "apps/pythias-platform/.env.local"));

const PORT = process.env.PORT || 3010;
const KEY = process.env.PYTHIAS_INTERNAL_KEY || env.PYTHIAS_INTERNAL_KEY;

(async () => {
    if (!KEY) { console.error("[adspend] PYTHIAS_INTERNAL_KEY not set — skipping"); return; }
    try {
        const res = await fetch(`http://127.0.0.1:${PORT}/api/internal/channels/sync-adspend`, { method: "POST", headers: { "x-pythias-internal-key": KEY } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        const { stores, ...byChannel } = d || {};
        console.log(`[adspend] stores=${stores ?? 0} ${Object.entries(byChannel).filter(([k]) => k !== "error").map(([k, v]) => `${k}=${v}`).join(" ")}`);
    } catch (e) {
        console.error(`[adspend] error: ${e.message}`);
    }
})();
