// Monthly: bill each storefront's prior-month email/SMS overage as a Stripe invoice item
// (rides their next storefront subscription invoice). Idempotent via UsageLedger.marketingBilled.
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const env = readEnv(path.join(ROOT, "apps/pythias-platform/.env.local"));

const PORT = process.env.PORT || 3010;
const KEY = process.env.PYTHIAS_INTERNAL_KEY || env.PYTHIAS_INTERNAL_KEY;

(async () => {
    if (!KEY) { console.error("[marketing-billing] PYTHIAS_INTERNAL_KEY not set — skipping"); return; }
    try {
        const res = await fetch(`http://127.0.0.1:${PORT}/api/internal/marketing/bill-overage`, { method: "POST", headers: { "x-pythias-internal-key": KEY, "Content-Type": "application/json" }, body: "{}" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        console.log(`[marketing-billing] period=${d.period} ledgers=${d.ledgers} billed=${d.billed} charged=${d.charged} skipped=${d.skipped}`);
    } catch (e) {
        console.error(`[marketing-billing] error: ${e.message}`);
    }
})();
