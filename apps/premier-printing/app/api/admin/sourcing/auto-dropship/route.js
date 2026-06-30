import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { premierAuthedOrg } from "@/lib/storefrontOrg";

export const dynamic = "force-dynamic";

// POST /api/admin/sourcing/auto-dropship { enabled } — supplier ships CJ-sourced items straight to the buyer.
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const enabled = !!body?.enabled;
    try {
        await Organization.updateOne({ _id: orgId }, { $set: { "autoDropship.enabled": enabled } });
        return NextResponse.json({ ok: true, enabled });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message || "Failed to update" }, { status: 500 });
    }
}
