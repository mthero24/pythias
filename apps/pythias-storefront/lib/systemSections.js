import { resolveSectionData } from "@pythias/storefront/server";

// Seller-defined merchandising sections for the built-in pages (home/product/cart/search). They're
// stored in site.pages under a reserved slug; this resolves that page's sections + their render data.
// `site` should already have the draft overlaid (withDraft) when previewing.
export async function systemPageSections(site, slug) {
    const page = (site?.pages || []).find((p) => p.slug === slug);
    const sections = page?.sections ?? [];
    if (!sections.length) return { sections: [], data: [] };
    const data = await resolveSectionData(sections, { orgId: site.orgId });
    return { sections, data };
}
