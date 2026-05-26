const PYTHIAS_PORT   = process.env.PORT                  || 3002;
const PREMIER_PORT   = process.env.PREMIER_PRINTING_PORT || 3000;
const PO_PORT        = process.env.PO_PORT               || 3001;

async function postJson(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return { ok: res.ok, data: await res.json() };
}

(async () => {
    const start = Date.now();
    console.log(`[generate-invoices] starting at ${new Date().toISOString()}`);

    let month, year;
    try {
        const { ok, data } = await postJson(`http://127.0.0.1:${PYTHIAS_PORT}/api/admin/generate-invoices`, {});
        if (!ok) throw new Error(JSON.stringify(data));
        month = data.month;
        year  = data.year;
        console.log(`[generate-invoices] done (${Date.now() - start}ms):`, JSON.stringify(data.results));
    } catch (e) {
        console.error(`[generate-invoices] error: ${e.message}`);
        process.exit(1);
    }

    console.log(`[auto-charge] attempting for ${year}-${String(month).padStart(2, "0")}`);
    const charges = await Promise.allSettled([
        postJson(`http://127.0.0.1:${PREMIER_PORT}/api/admin/service-invoices/auto-charge`, { month, year }),
        postJson(`http://127.0.0.1:${PO_PORT}/api/admin/service-invoices/auto-charge`,      { month, year }),
    ]);

    const [premier, po] = charges;
    console.log("[auto-charge] premier-printing:", premier.status === "fulfilled" ? JSON.stringify(premier.value.data) : premier.reason?.message);
    console.log("[auto-charge] po:",               po.status      === "fulfilled" ? JSON.stringify(po.value.data)      : po.reason?.message);
})();
