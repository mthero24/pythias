// Runs every 4 hours via PM2 cron_restart. Calls the Next.js blanks-forecast route
// so there's no separate DB connection to manage here.
const PORT = process.env.PORT || 3000;
const url = `http://127.0.0.1:${PORT}/api/admin/dashboard/blanks-forecast`;

(async () => {
    const start = Date.now();
    console.log(`[blanks-forecast] printthreads starting at ${new Date().toISOString()}`);
    try {
        const res = await fetch(url, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.msg);
        console.log(`[blanks-forecast] printthreads done — ${data.needsReorderCount} SKUs need reorder, est. order value $${(data.totalOrderValue || 0).toFixed(2)} (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[blanks-forecast] printthreads error: ${e.message}`);
        // exit 0 so PM2 marks this "stopped", not "errored" — cron_restart fires reliably on stopped processes
    }
})();
