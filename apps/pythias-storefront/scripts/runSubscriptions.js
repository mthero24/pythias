// Charges due "subscribe & save" subscriptions off-session and places a routed order per cycle.
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const env = readEnv(path.join(ROOT, "apps/pythias-storefront/.env.local"));

const PORT = process.env.PORT || 3020;
const KEY = process.env.PYTHIAS_INTERNAL_KEY || env.PYTHIAS_INTERNAL_KEY;

(async () => {
    if (!KEY) { console.error("[subscriptions] PYTHIAS_INTERNAL_KEY not set — skipping"); return; }
    try {
        const res = await fetch(`http://127.0.0.1:${PORT}/api/internal/subscriptions/bill`, { method: "POST", headers: { "x-pythias-internal-key": KEY } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        console.log(`[subscriptions] due=${d.due} billed=${d.billed} failed=${d.failed}`);
    } catch (e) {
        console.error(`[subscriptions] error: ${e.message}`);
    }
})();
