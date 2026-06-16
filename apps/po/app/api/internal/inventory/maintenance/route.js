import { NextResponse } from "next/server";
import {
    tagBulkOrders,
    addItemsToInventory,
    reconcileOrderedStatus,
    reconcileAllocated,
} from "@/functions/addItemsToInventory";

// Inventory maintenance chain — runs the full background reconciliation that used to live
// in a fragile in-process setInterval (gated on pm_id == 9). Now driven by a dedicated PM2
// service (scripts/runInventoryMaintenance.js on cron_restart) so it runs no matter which
// web worker is up.
//   POST /api/internal/inventory/maintenance   (x-cron-secret)
//   GET  /api/internal/inventory/maintenance?key=<CRON_SECRET>   (manual/browser run)
async function runChain() {
    const start = Date.now();
    await tagBulkOrders();
    await addItemsToInventory();
    // reconcileOrderedStatus clears stale "ordered" flags AND runs the capped recompute,
    // keeping the per-item flag aligned with authoritative active-PO truth.
    const report = await reconcileOrderedStatus();
    await reconcileAllocated();
    return { ms: Date.now() - start, reconcile: report };
}

export async function POST(req) {
    const secret = req.headers.get("x-cron-secret");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    try {
        const result = await runChain();
        console.log("[inventory/maintenance] done:", JSON.stringify(result));
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        console.error("[inventory/maintenance] fatal:", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function GET(req) {
    const key = new URL(req.url).searchParams.get("key");
    if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    try {
        const result = await runChain();
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        console.error("[inventory/maintenance] fatal:", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
