export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { RoutingLog } from "@pythias/mongo";
import mongoose from "mongoose";

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

    const [logs, total, summaryAgg] = await Promise.all([
        RoutingLog.find(query)
            .populate("selectedProviderId", "name slug")
            .sort({ routedAt: -1 })
            .skip(page * limit)
            .limit(limit)
            .lean(),
        RoutingLog.countDocuments(query),
        // Lifetime spend summary for this org (independent of pagination)
        RoutingLog.aggregate([
            { $match: { commerceOrgId: new mongoose.Types.ObjectId(orgId) } },
            { $group: {
                _id: null,
                totalOrders:   { $sum: 1 },
                totalWholesale: { $sum: { $ifNull: ["$totalWholesaleCost", 0] } },
                totalShipping:  { $sum: { $ifNull: ["$providerShippingPaid", 0] } },
                totalHandling:  { $sum: { $ifNull: ["$providerHandlingFee", 0] } },
                shipped:       { $sum: { $cond: [{ $in: ["$fulfillmentStatus", ["shipped", "delivered"]] }, 1, 0] } },
                inProduction:  { $sum: { $cond: [{ $eq: ["$fulfillmentStatus", "in_production"] }, 1, 0] } },
                unroutable:    { $sum: { $cond: [{ $eq: ["$status", "unroutable"] }, 1, 0] } },
            } },
        ]),
    ]);

    const s = summaryAgg[0] ?? {};
    const summary = {
        totalOrders:  s.totalOrders ?? 0,
        totalSpent:   (s.totalWholesale ?? 0) + (s.totalShipping ?? 0) + (s.totalHandling ?? 0), // cents
        totalWholesale: s.totalWholesale ?? 0,
        totalShipping:  s.totalShipping ?? 0,
        totalHandling:  s.totalHandling ?? 0,
        shipped:      s.shipped ?? 0,
        inProduction: s.inProduction ?? 0,
        unroutable:   s.unroutable ?? 0,
    };

    return NextResponse.json({ error: false, logs, total, page, limit, summary });
}
