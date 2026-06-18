import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveSite } from "@/lib/resolveSite";
import { PlatformProduct } from "@pythias/mongo";
import NoSite from "@/components/NoSite";

export const dynamic = "force-dynamic";

// Editor preview helper: the Product page's seller sections only render on a real product detail route,
// so jump to the store's newest product (preserving ?preview=1 so the draft is shown).
export default async function ProductPreviewRedirect({ searchParams }) {
    const sp = await searchParams;
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;

    const product = await PlatformProduct
        .findOne({ orgId: site.orgId, active: { $ne: false } })
        .select("_id").sort({ _id: -1 }).lean().catch(() => null);

    if (!product) {
        return (
            <div style={{ padding: "80px 24px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
                <h2 style={{ margin: "0 0 8px" }}>No products to preview yet</h2>
                <p style={{ opacity: 0.6 }}>Add a product, then your Product-page sections will show here.</p>
            </div>
        );
    }

    redirect(`/products/${product._id}${sp?.preview ? "?preview=1" : ""}`);
}
