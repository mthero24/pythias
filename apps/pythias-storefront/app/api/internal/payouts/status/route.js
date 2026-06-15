export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { assertInternal } from "@/lib/internal";
import { refreshConnectStatus } from "@/lib/payouts";

// POST /api/internal/payouts/status  (server-to-server)
// Body: { orgId }  →  { status, payouts_enabled, charges_enabled, accountId }
// Re-checks the seller's Connect account and updates org.storefrontConnect.status.
export async function POST(req) {
    const gate = assertInternal(req);
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const body = await req.json().catch(() => null);
    const orgId = body?.orgId;
    if (!orgId) return NextResponse.json({ error: "orgId is required" }, { status: 400 });

    try {
        const result = await refreshConnectStatus(orgId);
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 502 });
    }
}
