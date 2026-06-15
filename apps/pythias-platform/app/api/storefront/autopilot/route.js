export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, sessionUserEmail, svcError } from "@/lib/storefrontRoute";

// GET → { config, lastRun } (fast, no AI)
export async function GET() {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, ...(await storefront.getAutopilotState(orgId)) }); } catch (e) { return svcError(e); }
}
// POST {run:true} → fresh run (manual, no auto-apply) | {action} → apply one recommendation
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try {
        if (b.run) return NextResponse.json({ error: false, run: await storefront.runAutopilotForOrg(orgId, { apply: false, trigger: "manual", createdBy: await sessionUserEmail() }) });
        return NextResponse.json({ error: false, ...(await storefront.applyAutopilotAction(orgId, b.action, await sessionUserEmail())) });
    } catch (e) { return svcError(e); }
}
// PUT {autonomous?, autoApply?} → save autonomous config
export async function PUT(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, ...(await storefront.saveAutopilotConfig(orgId, b)) }); } catch (e) { return svcError(e); }
}
