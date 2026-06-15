// Weekly: email each storefront seller their 7-day analytics digest (via the platform endpoint).
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const env = readEnv(path.join(ROOT, "apps/pythias-platform/.env.local"));

const PORT = process.env.PORT || 3010;
const KEY = process.env.PYTHIAS_INTERNAL_KEY || env.PYTHIAS_INTERNAL_KEY;

(async () => {
    if (!KEY) { console.error("[weekly-report] PYTHIAS_INTERNAL_KEY not set — skipping"); return; }
    try {
        const res = await fetch(`http://127.0.0.1:${PORT}/api/internal/analytics/weekly-report`, { method: "POST", headers: { "x-pythias-internal-key": KEY } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        console.log(`[weekly-report] sent=${d.sent} skipped=${d.skipped} sites=${d.sites}`);
    } catch (e) {
        console.error(`[weekly-report] error: ${e.message}`);
    }
})();
