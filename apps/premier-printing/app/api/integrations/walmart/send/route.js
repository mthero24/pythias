import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { bulkUploadWalmart } from "@pythias/integrations";

function buildMPItem(product, variant, connection) {
    const colorName = variant.color?.name ?? "";
    const sizeName = variant.size?.name ?? "";
    const mainImage = product.productImages?.[0]?.image ?? "";
    const secondaryImages = product.productImages?.slice(1).map(i => i.image).filter(Boolean) ?? [];
    const variantImages = variant.images?.filter(Boolean) ?? [];
    const allSecondary = [...secondaryImages, ...variantImages];
    const weight = variant.size?.weight ?? 0.5;
    const price = variant.size?.retailPrice ?? 0;
    const parentSku = product.sku ?? product.name?.replace(/ /g, "-").toLowerCase();
    const brand = product.brand?.name ?? product.brand ?? "Pythias";
    const category = product.blanks?.[0]?.category?.[0] ?? "T-Shirts";
    const gender = product.gender ?? "Unisex Adults";
    const description = product.description ?? product.title ?? product.name ?? "";

    return {
        Sku: variant.sku,
        productIdentifiers: variant.upc ? {
            productIdentifier: { productIdType: "UPC", productId: variant.upc }
        } : undefined,
        productName: `${product.title ?? product.name} - ${colorName} - ${sizeName}`,
        category,
        price: { currency: "USD", amount: price },
        shippingWeight: { value: weight, unit: "LB" },
        Visible: {
            [category]: {
                shortDescription: description,
                brand,
                color: colorName,
                size: sizeName,
                gender,
                mainImageUrl: variant.image ?? mainImage,
                productSecondaryImageURL: allSecondary,
                variantGroupId: parentSku,
                variantAttributeNames: ["color", "size"],
                isPrimaryVariant: false,
                swatchImages: variant.image ? [{ swatchImageUrl: variant.image, swatchVariantAttribute: "color" }] : [],
            }
        }
    };
}

export async function POST(req) {
    const { product, connectionId } = await req.json();
    if (!product || !connectionId) {
        return NextResponse.json({ error: "product and connectionId are required" }, { status: 400 });
    }
    const connection = await ApiKeyIntegrations.findById(connectionId).lean();
    if (!connection) {
        return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const MPItem = (product.variantsArray ?? []).map(v => buildMPItem(product, v, connection)).filter(Boolean);
    if (MPItem.length === 0) {
        return NextResponse.json({ error: "No variants to upload" }, { status: 400 });
    }

    const result = await bulkUploadWalmart({
        clientId: connection.apiKey,
        clientSecret: connection.apiSecret,
        partnerId: connection.organization,
        type: "MP_ITEM",
        payload: { MPItem },
    });

    if (result?.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({ feedId: result.feedId });
}
