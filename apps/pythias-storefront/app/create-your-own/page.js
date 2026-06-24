import { headers } from "next/headers";
import { resolveSite } from "@/lib/resolveSite";
import { Blank } from "@pythias/mongo";
import { SiteFrame } from "@pythias/storefront";
import NoSite from "@/components/NoSite";
import CreateYourOwn from "@/components/customizer/CreateYourOwn";
import { siteMetadata } from "@/lib/siteMeta";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
    return siteMetadata({
        title: "Create Your Own Custom T-Shirts & Apparel",
        description: "Design your own custom t-shirts, hoodies, and apparel online. Upload your artwork, add text in any font, or generate a design with AI — then preview it on the product and order. No minimums.",
    });
}

export default async function CreateYourOwnPage({ searchParams }) {
    const site = await resolveSite((await headers()).get("host"));
    if (!site) return <NoSite />;
    // Embed mode (?embed=1) renders the bare studio for the native app's WebView — no store chrome.
    const embed = (await searchParams)?.embed === "1";

    const docs = await Blank.find({ orgId: site.orgId, active: { $ne: false } })
        .populate("colors", "name hexcode")
        .select("name code images sizes colors envelopes")
        .sort({ sales: -1 }).limit(60).lean().catch(() => []);

    // Pretty color label + hex (images[].color may be a name or a Color id).
    const labelFor = (idOrName, colors) => colors.find((c) => String(c._id) === idOrName || c.name === idOrName)?.name || idOrName;
    const hexFor = (idOrName, colors) => colors.find((c) => String(c._id) === idOrName || c.name === idOrName)?.hexcode || null;

    // A blank's print boxes live on images[].boxes, keyed by print-location ("front"/"center"/"back"/
    // "leftsleeve"…), each { x, y, width|boxWidth, height|boxHeight, rotation } in a 400 reference.
    // Group those locations into the three sides the buyer designs on; pick ONE garment image + box per
    // (color, side) — preferring the box whose key exactly names the side, else the largest print area.
    // Sleeve printing is disabled for now — only Front and Back. Check "back" first so a key like
    // "backCenter" is classified as Back rather than matching the Front "center" pattern.
    const SIDE_DEFS = [
        { side: "front", label: "Front" },
        { side: "back", label: "Back" },
    ];
    const classify = (locKey) => {
        if (/back/i.test(locKey)) return SIDE_DEFS[1];
        if (/sleeve|arm/i.test(locKey)) return null;                 // skip sleeve boxes
        if (/front|center|chest|default/i.test(locKey)) return SIDE_DEFS[0];
        return null;
    };

    const blanks = docs.map((b) => {
        const colorsById = b.colors || [];
        const byColor = new Map();   // colorName -> { color, swatch, sidesMap }
        for (const im of b.images || []) {
            if (!im.image || !im.boxes || typeof im.boxes !== "object") continue;
            const colorName = labelFor(im.color, colorsById);
            const entry = byColor.get(colorName) || { color: colorName, hex: hexFor(im.color, colorsById), swatch: im.image, sidesMap: {} };
            for (const [locKey, raw] of Object.entries(im.boxes)) {
                const w = raw?.boxWidth ?? raw?.width, h = raw?.boxHeight ?? raw?.height;
                if (typeof w !== "number" || typeof h !== "number") continue;
                const def = classify(locKey);
                if (!def) continue;
                const f = 400 / (raw.containerHeight || 400);
                const box = { x: (raw.x || 0) * f, y: (raw.y || 0) * f, w: w * f, h: h * f, rotation: raw.rotation || 0 };
                const exact = new RegExp(`^${def.side}$`, "i").test(locKey);
                const cand = { side: def.side, label: def.label, image: im.image, location: locKey, box, area: box.w * box.h, exact };
                const cur = entry.sidesMap[def.side];
                if (!cur || (cand.exact && !cur.exact) || (cand.exact === cur.exact && cand.area > cur.area)) entry.sidesMap[def.side] = cand;
            }
            byColor.set(colorName, entry);
        }
        const colors = [...byColor.values()].map((e) => {
            const sides = SIDE_DEFS.map((d) => e.sidesMap[d.side]).filter(Boolean)
                .map((c) => ({ side: c.side, label: c.label, image: c.image, location: c.location, box: c.box }));
            return { color: e.color, hex: e.hex || null, image: sides[0]?.image || e.swatch, sides };
        }).filter((c) => c.sides.some((s) => s.side === "front") && c.sides.some((s) => s.side === "back"));   // require BOTH front + back

        const sizes = (b.sizes || []).filter((s) => !s.hidden && s.name && (s.retailPrice || s.basePrice)).map((s) => ({
            name: s.name, sku: s.sku || "", priceCents: Math.round((s.retailPrice || s.basePrice || 0) * 100), wholesaleCents: Math.round((s.wholesaleCost || 0) * 100),
        }));
        // Print envelopes (physical print area, inches) per side + size — drives the studio box aspect
        // (so the design isn't distorted) and the production print-size mapping.
        const envelopes = (b.envelopes || []).map((e) => {
            const def = classify(e.placement || "");
            return def && e.width > 0 && e.height > 0
                ? { side: def.side, sizeName: e.sizeName || "", width: e.width, height: e.height } : null;
        }).filter(Boolean);
        return { id: String(b._id), name: b.name, code: b.code, image: colors[0]?.image || null, colors, sizes, envelopes };
    }).filter((b) => b.colors.length && b.sizes.length);

    const name = site.name || "our store";
    const productList = [...new Set(blanks.map((b) => b.name))].slice(0, 12);
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Create Your Own Custom Apparel — ${name}`,
        description: `Online design studio to create custom t-shirts, hoodies and apparel at ${name}. Upload artwork, add text, or generate a design with AI.`,
        potentialAction: { "@type": "CreateAction", name: "Design custom apparel" },
    };

    if (embed) return <CreateYourOwn blanks={blanks} embed />;

    return (
        <SiteFrame site={site}>
            <CreateYourOwn blanks={blanks} />

            {/* Crawlable SEO content — describes the tool for search engines (the studio above is a JS app). */}
            <section style={{ borderTop: "1px solid #eef2f7", background: "#fafbfc" }}>
                <div className="sf-container" style={{ maxWidth: 820, padding: "48px 20px", color: "#475569", lineHeight: 1.75 }}>
                    <h2 style={{ fontSize: "1.5rem", color: "#0f172a", margin: "0 0 14px" }}>Design Your Own Custom Apparel</h2>
                    <p style={{ margin: "0 0 14px" }}>
                        Create one-of-a-kind custom apparel with the {name} design studio. Upload your own artwork, add
                        custom text in dozens of fonts and colors, or generate original designs with AI — then place your
                        design exactly where you want it and preview it right on the product before you order. Print on the
                        front, the back, or both, with no order minimums.
                    </p>
                    {productList.length > 0 && (
                        <p style={{ margin: "0 0 14px" }}>
                            Personalize popular products including {productList.join(", ")} in a range of colors and sizes.
                            Whatever the occasion — team shirts, family reunions, small-business merch, gifts, or just for
                            fun — you can make it yours in minutes.
                        </p>
                    )}
                    <h3 style={{ fontSize: "1.1rem", color: "#0f172a", margin: "22px 0 10px" }}>How it works</h3>
                    <ol style={{ margin: 0, paddingLeft: 20 }}>
                        <li>Pick a product, color, and size.</li>
                        <li>Add your design — upload an image, type custom text, or generate art with AI.</li>
                        <li>Drag, resize, and rotate your design inside the printable area, on the front and back.</li>
                        <li>Save your design to your account to finish later, then add it to your cart and check out.</li>
                    </ol>
                </div>
            </section>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </SiteFrame>
    );
}
