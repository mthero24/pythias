const PORT = process.env.PORT || 3000;
const url = `http://127.0.0.1:${PORT}/api/admin/dashboard/forecast`;
(async () => {
    const start = Date.now();
    console.log(`[forecast] premier-printing starting at ${new Date().toISOString()}`);
    try {
        const res = await fetch(url, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.msg);
        console.log(`[forecast] premier-printing done (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[forecast] premier-printing error: ${e.message}`);
        process.exit(1);
    }
})();
