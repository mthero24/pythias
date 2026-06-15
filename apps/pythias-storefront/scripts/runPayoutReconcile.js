// Runs hourly via PM2 cron_restart. Calls the storefront reconcile route, which settles
// any storefront order that shipped but whose seller Stripe payout is still pending (e.g.
// the storefront was down when the provider-callback fired). settleOrderPayout is idempotent.
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const env = readEnv(path.join(ROOT, "apps/pythias-storefront/.env.local"));

const PORT = process.env.PORT || 3020;
const KEY = process.env.PYTHIAS_INTERNAL_KEY || env.PYTHIAS_INTERNAL_KEY;
const url = `http://127.0.0.1:${PORT}/api/internal/payouts/reconcile`;

(async () => {
    const start = Date.now();
    console.log(`[payout-reconcile] starting at ${new Date().toISOString()}`);
    if (!KEY) { console.error("[payout-reconcile] PYTHIAS_INTERNAL_KEY not set — skipping"); return; }
    try {
        const res = await fetch(url, { method: "POST", headers: { "x-pythias-internal-key": KEY } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        if (d.error) throw new Error(d.error);
        console.log(`[payout-reconcile] done — scanned=${d.scanned} paid=${d.paid} skipped=${d.skipped} errors=${d.errors} (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[payout-reconcile] error: ${e.message}`);
        // exit 0 so PM2 marks this "stopped", not "errored" — cron_restart fires reliably on stopped processes
    }
})();
