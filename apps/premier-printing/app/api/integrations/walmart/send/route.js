import { NextResponse } from "next/server";
import { ApiKeyIntegrations } from "@pythias/mongo";
import { bulkUploadWalmart } from "@pythias/integrations";

function buildMPItem(product, variant) {
    const colorName = variant.color?.name ?? "";
    const sizeName = variant.size?.name ?? "";
    const weight = variant.size?.weight ?? 0.5;
    const price = variant.size?.retailPrice ?? 0;
    const parentSku = product.sku ?? product.name?.replace(/ /g, "-").toLowerCase();
    const brand = typeof product.brand === "object" ? product.brand?.name : product.brand ?? "Pythias";
    const category = product.blanks?.[0]?.category?.[0] ?? "T-Shirts";
    const gender = product.gender ?? "Unisex Adults";
    const description = product.description ?? product.title ?? product.name ?? "";
    const title = product.title ?? product.name ?? "";
    const mainImage = variant.image ?? product.productImages?.[0]?.image ?? "";
    const secondaryImages = [
        ...((product.productImages ?? []).slice(1).map(i => i.image).filter(Boolean)),
        ...((variant.images ?? []).filter(Boolean)),
    ];

    return {
        sku: variant.sku,
        productType: category,
        productName: `${title} - ${colorName} - ${sizeName}`,
        productDescription: description,
        price,
        currency: "USD",
        shippingWeight: weight,
        brand,
        mainImageUrl: mainImage,
        productSecondaryImageURL: secondaryImages,
        upc: variant.upc,
        variantGroupId: parentSku,
        variantAttributeNames: ["color", "size"],
        color: colorName,
        size: sizeName,
        gender,
        isPrimaryVariant: false,
        swatchImages: mainImage ? [{ swatchImageUrl: mainImage, swatchVariantAttribute: "color" }] : [],
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

    const MPItem = (product.variantsArray ?? []).map(v => buildMPItem(product, v));
    if (MPItem.length === 0) {
        return NextResponse.json({ error: "No variants to upload" }, { status: 400 });
    }

    const payload = {
        MPItemFeedHeader: {
            businessUnit: "WALMART_US",
            version: "2.0.20240126-12_25_52-api",
            locale: "en",
        },
        MPItem,
    };

    const result = await bulkUploadWalmart({
        clientId: connection.apiKey,
        clientSecret: connection.apiSecret,
        partnerId: connection.organization,
        type: "MP_ITEM",
        payload,
    });

    if (result?.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
    }
    return NextResponse.json({ feedId: result.feedId });
}
