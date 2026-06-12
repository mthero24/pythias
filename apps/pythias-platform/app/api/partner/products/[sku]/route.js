import { NextResponse } from "next/server";
import { validatePartnerKey } from "@/lib/partnerAuth";
import { PlatformProduct as Products } from "@pythias/mongo";
import { shapeProduct } from "@/lib/partnerShape";

// GET /api/partner/products/:sku  — single product by product-level or variant SKU
export async function GET(req, { params }) {
    const auth = await validatePartnerKey(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = auth.org._id;

    const { sku } = await params;
    const decoded = decodeURIComponent(sku ?? "").trim();
    if (!decoded) return NextResponse.json({ error: "sku required" }, { status: 400 });

    const product = await Products.findOne({
        orgId,
        $or: [{ sku: decoded }, { "variantsArray.sku": decoded }],
    })
        .populate("variantsArray.color", "name hexcode sku")
        .populate("blanks", "code name sizes")
        .select("title sku brand description productImages variantsArray blanks lastUpdated createdAt")
        .lean();

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ product: shapeProduct(product) });
}
