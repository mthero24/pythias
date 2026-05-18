// Runs every 6 hours via PM2 cron_restart. Calls the Next.js tracking route
// so there's no separate DB connection to manage here.
const PORT = process.env.PORT || 3001;
const url = `http://127.0.0.1:${PORT}/api/production/shipping/track`;

(async () => {
    const start = Date.now();
    console.log(`[tracking] po starting at ${new Date().toISOString()}`);
    try {
        const res = await fetch(url, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.msg);
        console.log(`[tracking] po done — updated=${data.updated} / total=${data.total} (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[tracking] po error: ${e.message}`);
        // exit 0 so PM2 marks this "stopped", not "errored" — cron_restart fires reliably on stopped processes
    }
})();
