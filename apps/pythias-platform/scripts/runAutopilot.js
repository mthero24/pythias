// Daily: run AI store autopilot for every storefront that enabled autonomous mode.
// Auto-applies zero-risk actions; leaves money/sending actions as one-click recommendations.
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const env = readEnv(path.join(ROOT, "apps/pythias-platform/.env.local"));

const PORT = process.env.PORT || 3010;
const KEY = process.env.PYTHIAS_INTERNAL_KEY || env.PYTHIAS_INTERNAL_KEY;

(async () => {
    if (!KEY) { console.error("[autopilot] PYTHIAS_INTERNAL_KEY not set — skipping"); return; }
    try {
        const res = await fetch(`http://127.0.0.1:${PORT}/api/internal/autopilot/run`, { method: "POST", headers: { "x-pythias-internal-key": KEY } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        console.log(`[autopilot] orgsRun=${d.orgsRun} applied=${d.applied} pending=${d.pending} sites=${d.sites}`);
    } catch (e) {
        console.error(`[autopilot] error: ${e.message}`);
    }
})();
