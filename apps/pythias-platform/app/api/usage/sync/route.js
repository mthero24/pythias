import { NextResponse } from "next/server";
import { syncUsageLedger } from "@/lib/usageAlerts";

// Called by a cron job (e.g. Vercel Cron, PM2 cron task) to keep ledgers current
// Protected by a shared secret
export async function POST(req) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.USAGE_SYNC_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await req.json().catch(() => ({}));
    if (orgId) {
        await syncUsageLedger(orgId);
        return NextResponse.json({ ok: true, orgId });
    }

    // Sync all active orgs
    const { Organization } = await import("@pythias/mongo");
    const orgs = await Organization.find({ status: { $in: ['active', 'trial'] } }).select("_id").lean();
    await Promise.all(orgs.map(o => syncUsageLedger(o._id.toString())));
    return NextResponse.json({ ok: true, synced: orgs.length });
}
