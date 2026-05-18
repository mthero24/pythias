// Runs every hour via PM2 cron_restart.
// Calls the internal pull-orders API route so the Next.js process handles
// the DB work — no separate DB connection needed here.
const PORT   = process.env.PORT   || 3000;
const SECRET = process.env.CRON_SECRET || "";
const url    = `http://127.0.0.1:${PORT}/api/internal/pull-orders`;

(async () => {
    const start = Date.now();
    console.log(`[pull-orders] starting at ${new Date().toISOString()}`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "x-cron-secret": SECRET },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.msg ?? "pull-orders route returned error");
        console.log(`[pull-orders] done (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[pull-orders] error: ${e.message}`);
        // exit 0 so PM2 marks this "stopped", not "errored" — cron_restart fires reliably on stopped processes
    }
})();
