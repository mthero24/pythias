export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, premierUser, svcError } from "@/lib/storefrontOrg";

export async function GET(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try { return NextResponse.json({ error: false, ...(await storefront.getAutopilotState(orgId)) }); } catch (e) { return svcError(e); }
}
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try {
        if (b.run) return NextResponse.json({ error: false, run: await storefront.runAutopilotForOrg(orgId, { apply: false, trigger: "manual", createdBy: await premierUser(req) }) });
        return NextResponse.json({ error: false, ...(await storefront.applyAutopilotAction(orgId, b.action, await premierUser(req))) });
    } catch (e) { return svcError(e); }
}
export async function PUT(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try { return NextResponse.json({ error: false, ...(await storefront.saveAutopilotConfig(orgId, b)) }); } catch (e) { return svcError(e); }
}
