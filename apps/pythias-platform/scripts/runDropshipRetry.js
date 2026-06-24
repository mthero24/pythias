// Runs hourly via PM2 cron_restart. Calls the internal dropship-retry route so the Next.js
// process handles the DB work — no separate DB connection needed here.
const PORT   = process.env.PORT   || 3010;
const SECRET = process.env.CRON_SECRET || "";
const url    = `http://127.0.0.1:${PORT}/api/internal/dropship-retry`;

(async () => {
    const start = Date.now();
    console.log(`[dropship-retry] starting at ${new Date().toISOString()}`);
    try {
        const res = await fetch(url, { method: "POST", headers: { "x-cron-secret": SECRET } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.msg ?? "dropship-retry route returned error");
        console.log(`[dropship-retry] done — ${data.fulfilled}/${data.orders} fulfilled (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[dropship-retry] error: ${e.message}`);
        // exit 0 so PM2 marks this "stopped" (not "errored") — cron_restart fires reliably on stopped procs
    }
})();
