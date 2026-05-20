const PORT = process.env.PORT || 3001;
const url = `http://127.0.0.1:${PORT}/api/admin/dashboard/forecast`;
(async () => {
    const start = Date.now();
    console.log(`[forecast] po starting at ${new Date().toISOString()}`);
    try {
        const res = await fetch(url, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.msg);
        console.log(`[forecast] po done (${Date.now() - start}ms)`);
    } catch (e) {
        console.error(`[forecast] po error: ${e.message}`);
        process.exit(1);
    }
})();
