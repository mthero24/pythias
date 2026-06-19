export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontExperiment } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";

// GET /api/experiments/active — running experiments for this store (the tracker buckets visitors).
export async function GET(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ experiments: [] });
    const exps = await StorefrontExperiment.find({ orgId: ctx.orgId, status: "running" }).select("type variants target").limit(20).lean();
    return NextResponse.json({
        experiments: exps.map((e) => ({
            id: String(e._id), type: e.type,
            ...(e.target ? { target: { pageSlug: e.target.pageSlug, sectionId: e.target.sectionId } } : {}),
            variants: (e.variants || []).map((v) => ({ key: v.key, weightPct: v.weightPct, config: v.config || {} })),
        })),
    });
}
