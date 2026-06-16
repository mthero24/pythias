import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { Blank } from "@pythias/mongo";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import CreateYourOwn from "@/components/customizer/CreateYourOwn";

export const dynamic = "force-dynamic";

export default async function CreateYourOwnPage() {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;

    const docs = await Blank.find({ orgId: site.orgId, active: { $ne: false } })
        .populate("colors", "name")
        .select("name code images sizes colors")
        .sort({ sales: -1 }).limit(60).lean().catch(() => []);

    // Pretty color label (images[].color may be a name or a Color id) + the garment mockup + print boxes per color.
    const labelFor = (idOrName, colors) => colors.find((c) => String(c._id) === idOrName || c.name === idOrName)?.name || idOrName;

    const blanks = docs.map((b) => {
        const seen = new Set();
        const colors = (b.images || []).filter((i) => i.image).map((i) => ({
            color: labelFor(i.color, b.colors || []), image: i.image, boxes: i.boxes || null,
        })).filter((c) => { if (seen.has(c.color)) return false; seen.add(c.color); return true; });
        const sizes = (b.sizes || []).filter((s) => !s.hidden && s.name && (s.retailPrice || s.basePrice)).map((s) => ({
            name: s.name, sku: s.sku || "", priceCents: Math.round((s.retailPrice || s.basePrice || 0) * 100), wholesaleCents: Math.round((s.wholesaleCost || 0) * 100),
        }));
        return { id: String(b._id), name: b.name, code: b.code, colors, sizes };
    }).filter((b) => b.colors.length && b.sizes.length);

    return (
        <SiteFrame site={site}>
            <CreateYourOwn blanks={blanks} />
        </SiteFrame>
    );
}
