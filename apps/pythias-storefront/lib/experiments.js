import { StorefrontExperiment } from "@pythias/mongo";

// Running "section" A/B tests for a given page, keyed by the targeted section _id, so the page can
// render variants for those sections. Shape matches what SectionRenderer's `experiments` prop expects:
//   { [sectionId]: { id, variants: [{ key, config }] } }
export async function sectionExperimentsForPage(orgId, pageSlug) {
    if (!orgId || !pageSlug) return {};
    const exps = await StorefrontExperiment.find({ orgId, status: "running", type: "section", "target.pageSlug": pageSlug })
        .select("variants target").limit(20).lean().catch(() => []);
    const map = {};
    for (const e of exps) {
        const sid = e.target?.sectionId;
        if (!sid || !(e.variants?.length > 1)) continue;
        map[String(sid)] = { id: String(e._id), variants: e.variants.map((v) => ({ key: v.key, config: v.config || {} })) };
    }
    return map;
}
