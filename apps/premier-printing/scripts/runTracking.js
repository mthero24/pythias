// Runs every 6 hours via PM2 cron_restart. Calls the Next.js tracking route
// so there's no separate DB connection to manage here.
const PORT = process.env.PORT || 3000;
const url = `http://localhost:${PORT}/api/production/shipping/track`;

(async () => {
    const start = Date.now();
    console.log(`[tracking] premier-printing starting at ${new Date().toISOString()}`);
    try {
        const res = await fetch(url, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.msg);
        console.log(`[tracking] premier-printing done — updated=${data.updated} / total=${data.total} (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[tracking] premier-printing error: ${e.message}`);
        process.exit(1);
    }
})();
