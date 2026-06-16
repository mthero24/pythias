// Dedicated inventory-maintenance service. Runs on a PM2 cron_restart schedule, independent
// of the web cluster's workers, so the reconciliation runs no matter which worker is up.
// Calls the internal maintenance API route so the Next.js process handles the DB work — no
// separate DB connection / ESM-alias bootstrapping needed here.
const PORT   = process.env.PORT   || 3001;
const SECRET = process.env.CRON_SECRET || "";
const url    = `http://127.0.0.1:${PORT}/api/internal/inventory/maintenance`;

(async () => {
    const start = Date.now();
    console.log(`[inventory-maintenance] starting at ${new Date().toISOString()}`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "x-cron-secret": SECRET },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.msg ?? "maintenance route returned error");
        console.log(`[inventory-maintenance] done (${Date.now() - start}ms):`, JSON.stringify(data.reconcile ?? {}));
    } catch (e) {
        console.error(`[inventory-maintenance] error: ${e.message}`);
        // exit 0 so PM2 marks this "stopped", not "errored" — cron_restart fires reliably on stopped processes
    }
})();
