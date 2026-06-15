// Drains the storefront message outbox (transactional + marketing email/SMS). Runs on a short
// PM2 interval; batch size × interval = the send rate (kept low to build sender reputation).
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const env = readEnv(path.join(ROOT, "apps/pythias-storefront/.env.local"));

const PORT = process.env.PORT || 3020;
const KEY = process.env.PYTHIAS_INTERNAL_KEY || env.PYTHIAS_INTERNAL_KEY;

(async () => {
    const start = Date.now();
    if (!KEY) { console.error("[outbox] PYTHIAS_INTERNAL_KEY not set — skipping"); return; }
    try {
        const res = await fetch(`http://127.0.0.1:${PORT}/api/internal/outbox/drain`, { method: "POST", headers: { "x-pythias-internal-key": KEY } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        console.log(`[outbox] processed=${d.processed} sent=${d.sent} skipped=${d.skipped} failed=${d.failed} (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[outbox] error: ${e.message}`);
    }
})();
