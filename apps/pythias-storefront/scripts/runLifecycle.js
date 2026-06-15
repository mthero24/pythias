// Hourly: enqueue abandoned-cart / abandoned-session marketing nudges (the outbox sends them).
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const env = readEnv(path.join(ROOT, "apps/pythias-storefront/.env.local"));

const PORT = process.env.PORT || 3020;
const KEY = process.env.PYTHIAS_INTERNAL_KEY || env.PYTHIAS_INTERNAL_KEY;

(async () => {
    if (!KEY) { console.error("[lifecycle] PYTHIAS_INTERNAL_KEY not set — skipping"); return; }
    try {
        const res = await fetch(`http://127.0.0.1:${PORT}/api/internal/marketing/lifecycle`, { method: "POST", headers: { "x-pythias-internal-key": KEY } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        console.log(`[lifecycle] abandonedCart=${d.abandonedCart} abandonedSession=${d.abandonedSession}`);
    } catch (e) {
        console.error(`[lifecycle] error: ${e.message}`);
    }
})();
