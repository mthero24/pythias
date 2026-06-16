import { NextResponse } from "next/server";
import { reconcileOrderedStatus } from "@/functions/addItemsToInventory";

// Reconcile the per-item "ordered" flag back to authoritative PO truth.
//   GET  /api/admin/inventory/reconcile-ordered   → dry-run report (no writes)
//   POST /api/admin/inventory/reconcile-ordered   → apply the fix
// After applying, count(stockStatus="ordered") == sum of unreceived PO line quantities.
export async function GET() {
    try {
        const report = await reconcileOrderedStatus({ dryRun: true });
        return NextResponse.json({ error: false, report });
    } catch (e) {
        console.error("[reconcile-ordered] GET fatal:", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const report = await reconcileOrderedStatus({ dryRun: false });
        console.log("[reconcile-ordered] applied:", JSON.stringify(report));
        return NextResponse.json({ error: false, report });
    } catch (e) {
        console.error("[reconcile-ordered] POST fatal:", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
