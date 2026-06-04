import { NextResponse } from "next/server";
import { Products } from "@pythias/mongo";

// Rewrites platform-rendered image URLs to simplysage-rendered image URLs.
// Affects products created since a given date (defaults to 48 hours ago).
export async function POST(req) {
    try {
        const { since: sinceParam } = await req.json().catch(() => ({}));
        const since = sinceParam ? new Date(sinceParam) : (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d; })();

        const OLD = "https://platform.pythiastechnologies.com/api/renderImages/";
        const NEW  = "https://simplysage.pythiastechnologies.com/api/renderImages/";

        const rewriteUrl = (url) => {
            if (typeof url !== "string") return url;
            if (url.includes(OLD)) return url.replace(OLD, NEW);
            // Also fix relative /api/renderImages/ paths stored without domain
            if (url.startsWith("/api/renderImages/")) return `https://simplysage.pythiastechnologies.com${url}`;
            return url;
        };

        // Recursively rewrite ANY string value containing the old URL (not just "image" keys)
        const rewriteObj = (obj) => {
            if (typeof obj === "string") return rewriteUrl(obj);
            if (!obj || typeof obj !== "object") return obj;
            if (Array.isArray(obj)) return obj.map(rewriteObj);
            const out = {};
            for (const k of Object.keys(obj)) out[k] = rewriteObj(obj[k]);
            return out;
        };

        // Search variantsArray.image with a simple substring match,
        // then also scan variantImages in application code (Object type — can't regex in MongoDB)
        const products = await Products.find({
            $or: [
                { "variantsArray.image":  { $regex: "platform", $options: "i" } },
                { "variantsArray.images": { $regex: "platform", $options: "i" } },
                { "productImages.image":  { $regex: "platform", $options: "i" } },
            ],
        }).lean();

        // Also find products where variantImages or variantSecondaryImages contain platform URLs
        // (these are Object fields so we can't regex-query them in MongoDB — load and check in JS)
        const allWithVariantImages = await Products.find({
            $or: [
                { variantImages: { $exists: true, $ne: null } },
                { variantSecondaryImages: { $exists: true, $ne: null } },
            ],
        }).lean();

        const hasPlatform = (obj) => JSON.stringify(obj || "").includes("platform.pythiastechnologies.com") || JSON.stringify(obj || "").includes("/api/renderImages/");
        const extraProducts = allWithVariantImages.filter(p =>
            hasPlatform(p.variantImages) || hasPlatform(p.variantSecondaryImages)
        );

        // Merge, deduplicate by _id
        const seen = new Set(products.map(p => String(p._id)));
        for (const p of extraProducts) {
            if (!seen.has(String(p._id))) { products.push(p); seen.add(String(p._id)); }
        }

        console.log(`[fix-image-urls] ${products.length} products to fix`);
        let updated = 0;

        for (const product of products) {
            const $set = {};

            if ((product.variantsArray || []).some(v => (v.image || "").includes("platform.pythiastechnologies.com") || (v.images || []).some(i => (i || "").includes("platform.pythiastechnologies.com")))) {
                $set.variantsArray = (product.variantsArray || []).map(v => ({
                    ...v,
                    image:  rewriteUrl(v.image),
                    images: (v.images || []).map(rewriteUrl),
                }));
            }
            if (product.variantImages && JSON.stringify(product.variantImages).includes("platform.pythiastechnologies.com")) {
                $set.variantImages = rewriteObj(product.variantImages);
            }
            if (product.variantSecondaryImages && JSON.stringify(product.variantSecondaryImages).includes("platform.pythiastechnologies.com")) {
                $set.variantSecondaryImages = rewriteObj(product.variantSecondaryImages);
            }
            if ((product.productImages || []).some(pi => (pi.image || "").includes("platform.pythiastechnologies.com"))) {
                $set.productImages = (product.productImages || []).map(pi => ({ ...pi, image: rewriteUrl(pi.image) }));
            }

            if (Object.keys($set).length > 0) {
                await Products.updateOne({ _id: product._id }, { $set });
                updated++;
            }
        }

        return NextResponse.json({ error: false, total: products.length, updated });
    } catch (e) {
        console.error("[fix-image-urls]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
