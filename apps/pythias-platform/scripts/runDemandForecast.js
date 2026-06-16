// Daily: refresh AI demand curves + auto-restock for every storefront (emails suppliers).
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const ROOT = path.resolve(__dirname, "../../..");
const readEnv = (p) => { try { return dotenv.parse(fs.readFileSync(p)); } catch { return {}; } };
const env = readEnv(path.join(ROOT, "apps/pythias-platform/.env.local"));

const PORT = process.env.PORT || 3010;
const KEY = process.env.PYTHIAS_INTERNAL_KEY || env.PYTHIAS_INTERNAL_KEY;

(async () => {
    if (!KEY) { console.error("[demand] PYTHIAS_INTERNAL_KEY not set — skipping"); return; }
    try {
        const res = await fetch(`http://127.0.0.1:${PORT}/api/internal/demand/run`, { method: "POST", headers: { "x-pythias-internal-key": KEY } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        console.log(`[demand] stores=${d.stores} computed=${d.computed} tasks=${d.tasksCreated} emailed=${d.emailed}`);
    } catch (e) {
        console.error(`[demand] error: ${e.message}`);
    }
})();
