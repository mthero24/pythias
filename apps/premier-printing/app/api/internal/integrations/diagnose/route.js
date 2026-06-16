import { NextResponse } from "next/server";
import { diagnoseOrderConnections, diagnoseListingConnections } from "@/functions/integrationDiagnostics";
import { pullOrders } from "@/functions/pullOrders";

// Read-only integration diagnostics for both surfaces (orders + listing).
//   GET /api/internal/integrations/diagnose                 → both surfaces
//   GET /api/internal/integrations/diagnose?surface=orders  → orders only
//   GET /api/internal/integrations/diagnose?surface=listing → listing only
//   GET /api/internal/integrations/diagnose?includeDisabled=1 → include pull-disabled conns
//   GET /api/internal/integrations/diagnose?pull=1          → run the real full order pull
export async function GET(req) {
    try {
        const params = new URL(req.url).searchParams;
        if (params.get("pull")) {
            await pullOrders();
            return NextResponse.json({ ran: "pullOrders", ok: true });
        }
        const surface = params.get("surface");
        const includeDisabled = !!params.get("includeDisabled");
        const out = {};
        if (surface !== "listing") out.orders = await diagnoseOrderConnections({ includeDisabled });
        if (surface !== "orders") out.listing = await diagnoseListingConnections();
        return NextResponse.json(out);
    } catch (e) {
        console.error("[integrations/diagnose] fatal:", e);
        return NextResponse.json({ error: true, msg: e.message, stack: e.stack }, { status: 500 });
    }
}
