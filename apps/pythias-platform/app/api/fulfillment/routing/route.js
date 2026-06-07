export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { RoutingLog } from "@pythias/mongo";

// GET /api/fulfillment/routing?page=0&limit=25&status=routed
// Returns routing logs for the current commerce org, newest first.
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const { searchParams } = new URL(req.url);
    const page   = Math.max(0, parseInt(searchParams.get("page")  ?? "0"));
    const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "25"));
    const status = searchParams.get("status"); // optional filter

    const query = { commerceOrgId: orgId };
    if (status) query.status = status;

    const [logs, total] = await Promise.all([
        RoutingLog.find(query)
            .populate("selectedProviderId", "name slug")
            .sort({ routedAt: -1 })
            .skip(page * limit)
            .limit(limit)
            .lean(),
        RoutingLog.countDocuments(query),
    ]);

    return NextResponse.json({ error: false, logs, total, page, limit });
}
