import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PlatformProduct, resolveVariantSize } from "@pythias/mongo";

// One-time (idempotent) backfill: copy each blank size's compareAtPrice onto the product's matching
// variant, so existing products show the compare-at "was" price without a manual re-save. Per the
// caller's org. Updates only the specific variants via arrayFilters (no whole-array rewrite).
export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    try {
        const cursor = PlatformProduct.find({ orgId: token.orgId }).select("variantsArray")
            .populate({ path: "variantsArray.blank", select: "sizes" }).lean().cursor();
        let scanned = 0, updated = 0, ops = [];
        const flush = async () => { if (!ops.length) return; const r = await PlatformProduct.bulkWrite(ops); updated += (r.modifiedCount || 0); ops = []; };
        for await (const doc of cursor) {
            scanned++;
            const set = {}; const filters = []; let i = 0;
            for (const v of (doc.variantsArray || [])) {
                if (!v?._id) continue;
                const sizeName = resolveVariantSize(v, v.blank?.sizes);
                const blankSize = (v.blank?.sizes || []).find((s) => s.name === sizeName);
                const cap = Number(blankSize?.compareAtPrice) || 0;
                if (cap > 0 && cap !== (Number(v.compareAtPrice) || 0)) {
                    const id = `v${i++}`;
                    set[`variantsArray.$[${id}].compareAtPrice`] = cap;
                    filters.push({ [`${id}._id`]: v._id });
                }
            }
            if (filters.length) ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set }, arrayFilters: filters } });
            if (ops.length >= 200) await flush();
        }
        await flush();
        return NextResponse.json({ error: false, scanned, updated });
    } catch (e) {
        console.error("[backfill/compare-at]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
