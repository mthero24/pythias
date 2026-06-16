export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { sessionOrgId, sessionUserEmail, svcError } from "@/lib/storefrontRoute";

export async function GET() {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const [forecast, tasks, blanks] = await Promise.all([storefront.demandForecast(orgId), storefront.listRestockTasks(orgId, "open"), storefront.blankDemandForecast(orgId)]);
        return NextResponse.json({ error: false, forecast, tasks, blanks });
    } catch (e) { return svcError(e); }
}
export async function POST(req) {
    const orgId = await sessionOrgId();
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try {
        if (b.op === "inventory") return NextResponse.json({ error: false, inventory: await storefront.saveInventory(orgId, b.productId, b.patch || {}) });
        if (b.op === "reorder")   return NextResponse.json({ error: false, ...(await storefront.createRestockTask(orgId, { ...b, createdBy: await sessionUserEmail() })) });
        if (b.op === "task")      return NextResponse.json({ error: false, task: await storefront.updateRestockTask(orgId, b.id, b.status) });
        return NextResponse.json({ error: "Unknown op" }, { status: 400 });
    } catch (e) { return svcError(e); }
}
