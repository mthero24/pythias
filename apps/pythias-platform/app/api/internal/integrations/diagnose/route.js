import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { diagnoseOrderConnections, diagnoseListingConnections } from "@/functions/integrationDiagnostics";

// Read-only PER-ORG integration diagnostics (orders + listing) for the logged-in org.
//   GET /api/internal/integrations/diagnose                 → both surfaces
//   GET /api/internal/integrations/diagnose?surface=orders  → orders only
//   GET /api/internal/integrations/diagnose?surface=listing → listing only
//   GET /api/internal/integrations/diagnose?includeDisabled=1
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    try {
        const params = new URL(req.url).searchParams;
        const surface = params.get("surface");
        const includeDisabled = !!params.get("includeDisabled");
        const out = {};
        if (surface !== "listing") out.orders = await diagnoseOrderConnections(orgId, { includeDisabled });
        if (surface !== "orders") out.listing = await diagnoseListingConnections(orgId);
        return NextResponse.json(out);
    } catch (e) {
        console.error("[integrations/diagnose] fatal:", e);
        return NextResponse.json({ error: true, msg: e.message, stack: e.stack }, { status: 500 });
    }
}
