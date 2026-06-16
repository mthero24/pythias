import { NextResponse } from "next/server";
import { closeStaleInventoryOrders } from "@/functions/addItemsToInventory";

// Force-close stale unreceived POs ordered before a cutoff date (received in real life but
// never marked received). Drops phantom active-PO capacity, then reconciles the "ordered"
// item flags down to truth. Does NOT restock or print labels.
//   GET  /api/admin/inventory/close-stale-orders?before=YYYY-MM-DD   → dry-run (no writes)
//   POST /api/admin/inventory/close-stale-orders?before=YYYY-MM-DD   → apply
function getBefore(req) {
    return new URL(req.url).searchParams.get("before");
}

export async function GET(req) {
    try {
        const before = getBefore(req);
        if (!before) return NextResponse.json({ error: true, msg: "?before=YYYY-MM-DD required" }, { status: 400 });
        const report = await closeStaleInventoryOrders({ before, dryRun: true });
        return NextResponse.json({ error: false, report });
    } catch (e) {
        console.error("[close-stale-orders] GET fatal:", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const before = getBefore(req);
        if (!before) return NextResponse.json({ error: true, msg: "?before=YYYY-MM-DD required" }, { status: 400 });
        const report = await closeStaleInventoryOrders({ before, dryRun: false });
        console.log("[close-stale-orders] applied:", JSON.stringify({ ...report, reconcile: report.reconcile && { ...report.reconcile, unreceivedOrders: undefined } }));
        return NextResponse.json({ error: false, report });
    } catch (e) {
        console.error("[close-stale-orders] POST fatal:", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
