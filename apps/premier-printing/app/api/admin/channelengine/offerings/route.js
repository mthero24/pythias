import { NextResponse } from "next/server";
import { Products, Design } from "@pythias/mongo";

// GET /api/admin/channelengine/offerings?q=&page=1&pageSize=20
// Search Pythias products to create CE offerings
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const q        = searchParams.get("q") || "";
        const page     = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "20", 10));
        const skip     = (page - 1) * pageSize;

        let designQuery = {};
        if (q) designQuery = { $or: [
            { sku: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
        ]};

        const [designs, totalDesigns] = await Promise.all([
            Design.find(designQuery).sort({ _id: -1 }).skip(skip).limit(pageSize).lean(),
            Design.countDocuments(designQuery),
        ]);

        if (designs.length === 0) {
            return NextResponse.json({ error: false, products: [], total: 0 });
        }

        const designIds = designs.map(d => d._id);
        const products = await Products
            .find({ design: { $in: designIds } })
            .populate("variantsArray.color")
            .populate("blanks")
            .lean();

        // Build a lookup: designId → design
        const designMap = Object.fromEntries(designs.map(d => [d._id.toString(), d]));

        const results = products.map(p => {
            const design   = designMap[p.design?.toString()] ?? {};
            const blank    = p.blanks?.[0] ?? {};
            const variants = p.variantsArray ?? [];

            // Compute price range using blank.sizes for size retail prices
            const prices = variants
                .map(v => {
                    if (v.price) return Number(v.price);
                    const sizeObj = (blank.sizes ?? []).find(s => s._id?.toString() === String(v.size));
                    return sizeObj?.retailPrice ? Number(sizeObj.retailPrice) : null;
                })
                .filter(n => n != null && n > 0);

            const minPrice = prices.length ? Math.min(...prices) : 0;
            const maxPrice = prices.length ? Math.max(...prices) : 0;

            const mainImage = p.productImages?.[0]?.image
                || variants[0]?.images?.[0]
                || variants[0]?.image
                || null;

            return {
                _id: p._id,
                title:        p.title || design.name || design.sku || String(p._id),
                sku:          p.sku || design.sku || null,
                designSku:    design.sku,
                variantCount: variants.filter(v => v.sku).length,
                minPrice,
                maxPrice,
                mainImage,
                ids:          p.ids ?? {},
                sentToCE:     !!(p.ids?.["ChannelEngine"] || p.ids?.["channelengine"]),
            };
        });

        return NextResponse.json({ error: false, products: results, total: totalDesigns });
    } catch (e) {
        console.error("[channelengine/offerings GET]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
