import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PlatformProduct, computeProductFacets } from "@pythias/mongo";

// One-time (idempotent) backfill of the denormalized Atlas facet fields (facetColors/facetSizes/
// minPriceCents) for the caller's org. New + edited products stay in sync via the Products model's
// pre-save hook; this catches everything created before the hook existed. Safe to re-run.
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    try {
        // Populate color refs (canonical Color name) and blank sizes ([{_id,name}]) so facetColors gets
        // the right color name and facetSizes can resolve size _ids → names on older products.
        const cursor = PlatformProduct.find({ orgId: token.orgId }).select("variantsArray")
            .populate({ path: "variantsArray.color", select: "name" })
            .populate({ path: "variantsArray.blank", select: "sizes" })
            .lean().cursor();
        let scanned = 0, updated = 0, ops = [];
        // Diagnostics: how many products still have an ObjectId-looking size after resolution (so you can
        // see whether the blank lookup is actually working), with a small sample for inspection.
        let unresolvedSizes = 0; const sample = [];
        const looksLikeId = (s) => /^[a-f0-9]{24}$/i.test(String(s || ""));
        const flush = async () => { if (!ops.length) return; const r = await PlatformProduct.bulkWrite(ops); updated += (r.modifiedCount || 0); ops = []; };
        for await (const doc of cursor) {
            scanned++;
            const f = computeProductFacets(doc);
            if ((f.facetSizes || []).some(looksLikeId)) {
                unresolvedSizes++;
                if (sample.length < 5) {
                    const v0 = (doc.variantsArray || [])[0];
                    sample.push({ productId: String(doc._id), facetSizes: f.facetSizes, blankHasSizes: !!(v0?.blank?.sizes?.length), rawSize: v0?.size });
                }
            }
            ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { facetColors: f.facetColors, facetSizes: f.facetSizes, minPriceCents: f.minPriceCents } } } });
            if (ops.length >= 500) await flush();
        }
        await flush();
        return NextResponse.json({ error: false, scanned, updated, unresolvedSizes, sample });
    } catch (e) {
        console.error("[backfill/facets]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
