import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Organization } from "@pythias/mongo";

export const dynamic = "force-dynamic";

// POST /api/admin/sourcing/auto-dropship { enabled }
// Turn on/off: supplier ships CJ-sourced catalog items straight to the buyer when an order is placed.
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const enabled = !!body?.enabled;
    try {
        await Organization.updateOne({ _id: token.orgId }, { $set: { "autoDropship.enabled": enabled } });
        return NextResponse.json({ ok: true, enabled });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message || "Failed to update" }, { status: 500 });
    }
}
