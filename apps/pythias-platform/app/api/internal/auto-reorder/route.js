import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { runCjReorder } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

// POST /api/internal/auto-reorder  (PM2 cron, gated by CRON_SECRET)
// Sweeps every org that opted into auto-reorder and restocks its low CJ-sourced catalog stock.
export async function POST(req) {
    const secret = req.headers.get("x-cron-secret");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    }
    const orgs = await Organization.find({ "autoReorder.enabled": true }).select("_id name").lean();
    const summary = [];
    for (const org of orgs) {
        try {
            const r = await runCjReorder(String(org._id));
            await Organization.updateOne({ _id: org._id }, { $set: { "autoReorder.lastRunAt": new Date() } });
            summary.push({ org: org.name || String(org._id), placed: r.placed || 0, ok: r.ok !== false, error: r.error });
            console.log(`[auto-reorder] ${org.name || org._id}: placed ${r.placed || 0}${r.error ? ` (${r.error})` : ""}`);
        } catch (e) {
            summary.push({ org: org.name || String(org._id), ok: false, error: e.message });
            console.error(`[auto-reorder] ${org.name || org._id} failed: ${e.message}`);
        }
    }
    return NextResponse.json({ error: false, orgs: orgs.length, summary });
}
