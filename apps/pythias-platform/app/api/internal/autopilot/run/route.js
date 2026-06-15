export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";

// POST /api/internal/autopilot/run — run autopilot for every store with autonomous mode on.
// Driven daily by PM2 (scripts/runAutopilot.js). Shared-secret guarded.
export async function POST(req) {
    if (!process.env.PYTHIAS_INTERNAL_KEY || req.headers.get("x-pythias-internal-key") !== process.env.PYTHIAS_INTERNAL_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try { return NextResponse.json({ error: false, ...(await storefront.runAutonomousAutopilot()) }); }
    catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
