import { NextResponse } from "next/server";
import { Products } from "@pythias/mongo";
import { handleEbaySendPOST } from "@pythias/integrations";

export async function POST(req) {
    const { connectionId, variantSku, price, brand } = await req.json();
    if (!connectionId || !variantSku) {
        return NextResponse.json({ error: "connectionId and variantSku required" }, { status: 400 });
    }

    const product = await Products.findOne({ "variantsArray.sku": variantSku })
        .populate("blanks")
        .populate({ path: "variantsArray.color" })
        .populate({ path: "variantsArray.blank" })
        .populate("design")
        .lean();

    if (!product) {
        return NextResponse.json({ error: "No product found for SKU: " + variantSku }, { status: 404 });
    }

    const variant = product.variantsArray.find(v => v.sku === variantSku);
    if (!variant) {
        return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const patchedVariant = {
        ...variant,
        price: price != null ? parseFloat(price) : (variant.price ?? 0),
    };

    const patchedProduct = {
        ...product,
        variantsArray: [patchedVariant],
        brand: brand || product.brand || "Custom",
    };

    const syntheticReq = {
        json: async () => ({ connectionId, product: patchedProduct }),
    };

    return handleEbaySendPOST(syntheticReq);
}
