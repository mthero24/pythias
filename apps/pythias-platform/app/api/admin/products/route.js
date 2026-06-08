import { NextResponse } from "next/server";
import { PlatformProduct, PlatformInventory, SkuToUpc } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { createTempUpcs, updateTempUpc } from "@pythias/integrations";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";

const PER_PAGE = 50;

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const active = url.searchParams.get("active");

    const filter = { orgId };
    if (q) filter.$text = { $search: q };
    if (active === "true") filter.active = true;
    if (active === "false") filter.active = false;

    try {
        const [products, count] = await Promise.all([
            PlatformProduct.find(filter)
                .sort(q ? { score: { $meta: "textScore" }, _id: -1 } : { _id: -1 })
                .skip((page - 1) * PER_PAGE)
                .limit(PER_PAGE)
                .populate("design", "sku name printType")
                .populate("blanks", "code name sizes colors")
                .populate("colors", "name hexcode sku")
                .populate("productImages.color", "name hexcode sku")
                .populate("variantsArray.blank", "code name")
                .populate("variantsArray.color", "name hexcode sku")
                .lean(),
            PlatformProduct.countDocuments(filter),
        ]);

        // For products saved before colors/blanks were stored, derive from populated variantsArray
        for (const product of products) {
            if (!product.colors?.length && product.variantsArray?.length) {
                const seen = new Map();
                for (const v of product.variantsArray) {
                    if (v.color?._id) {
                        const id = v.color._id.toString();
                        if (!seen.has(id)) seen.set(id, v.color);
                    }
                }
                product.colors = [...seen.values()];
            }
            if (!product.blanks?.length && product.variantsArray?.length) {
                const seen = new Map();
                for (const v of product.variantsArray) {
                    if (v.blank?._id) {
                        const id = v.blank._id.toString();
                        if (!seen.has(id)) seen.set(id, v.blank);
                    }
                }
                product.blanks = [...seen.values()];
            }
        }

        return NextResponse.json({ error: false, products: JSON.parse(JSON.stringify(products)), count });
    } catch (e) {
        console.error("[products GET]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

function flattenVariants(raw) {
    const result = [];
    const v = raw.variants;
    if (!v || typeof v !== "object") return result;
    for (const blankCode of Object.keys(v)) {
        if (raw.hasThreadColors) {
            for (const tc of Object.keys(v[blankCode])) {
                for (const colorName of Object.keys(v[blankCode][tc])) {
                    result.push(...(v[blankCode][tc][colorName] || []));
                }
            }
        } else {
            for (const colorName of Object.keys(v[blankCode])) {
                result.push(...(v[blankCode][colorName] || []));
            }
        }
    }
    return result;
}

async function buildPlatformDoc(raw, orgId) {
    let variantsFlat = flattenVariants(raw);
    if (variantsFlat.length === 0 && Array.isArray(raw.variantsArray) && raw.variantsArray.length > 0) {
        variantsFlat = raw.variantsArray;
    }

    const variantsArray = await Promise.all(variantsFlat.map(async v => {
        const blankId = v.blank?._id ?? v.blank ?? null;
        const colorId = v.color?._id ?? v.color ?? null;
        const sizeName = v.size?.name ?? (typeof v.size === "string" ? v.size : "");

        const inventory = blankId && colorId
            ? await PlatformInventory.findOne({ orgId, blank: blankId, color: colorId }).lean()
            : null;

        const rawImages = v.images ?? [];
        const images = rawImages.map(i => i?.image ?? i).filter(Boolean);

        return {
            image: v.image ?? images[0] ?? "",
            images,
            color: colorId,
            colorName: v.color?.name ?? "",
            colorHex: v.color?.hexcode ?? "",
            size: sizeName,
            sku: v.sku ?? "",
            upc: v.upc ?? "",
            gtin: v.gtin ?? "",
            blank: blankId,
            inventory: inventory?._id ?? null,
            price: v.price ?? 0,
            wholesalePrice: v.wholesalePrice ?? 0,
            active: true,
            ...(v.ids ? { ids: v.ids } : {}),
        };
    }));

    const productImages = (raw.productImages || []).map(pi => ({
        image: pi.image ?? pi.url ?? "",
        color: pi.color?._id ?? pi.color ?? null,
        colorName: pi.color?.name ?? pi.colorName ?? null,
        blank: pi.blank?._id ?? pi.blank ?? null,
        sku: pi.sku ?? "",
        side: pi.side ?? pi.sides ?? null,
    }));

    const defaultColorId = raw.defaultColor?._id ?? raw.defaultColor ?? variantsFlat[0]?.color?._id ?? variantsFlat[0]?.color ?? null;

    const uniqueColorIds = [...new Map(
        variantsFlat.map(v => {
            const id = v.color?._id ?? v.color;
            return [String(id), id];
        }).filter(([k]) => k !== "null" && k !== "undefined")
    ).values()];

    const dept = raw.department;
    return {
        orgId,
        design: raw.design?._id ?? raw.design ?? null,
        blanks: raw.blanks?.map(b => b._id ?? b) ?? [],
        colors: raw.colors?.map(c => c._id ?? c).length > 0
            ? raw.colors.map(c => c._id ?? c)
            : uniqueColorIds,
        title: raw.title,
        sku: raw.sku,
        description: raw.description ?? "",
        brand: raw.brand ?? "",
        gender: raw.gender ?? "",
        season: raw.season ?? "",
        tags: raw.tags ?? [],
        category: Array.isArray(raw.category) ? raw.category : (raw.category ? [raw.category] : []),
        department: Array.isArray(dept) ? dept : (dept ? [dept] : []),
        active: true,
        variants: null,
        variantsArray,
        defaultColor: defaultColorId,
        variantImages: raw.variantImages ?? null,
        variantSecondaryImages: raw.variantSecondaryImages ?? null,
        productImages,
        isNFProduct: raw.isNFProduct ?? true,
        lastUpdated: new Date(),
        marketplaceValues: raw.marketplaceValues ?? null,
        theme: raw.theme ?? "",
        sportUsedFor: raw.sportUsedFor ?? "",
        ...(raw.video !== undefined ? { video: raw.video } : {}),
        ...(raw.pendingVideoTask !== undefined ? { pendingVideoTask: raw.pendingVideoTask } : {}),
        ...(raw.tempImages?.length ? { tempImages: raw.tempImages } : {}),
        ...(raw.designTemplateId ? { designTemplateId: raw.designTemplateId } : {}),
        ...(raw.ids ? { ids: raw.ids } : {}),
        ...(raw.marketPlacesArray ? {
            marketPlacesArray: raw.marketPlacesArray.map(m => m._id ?? m),
        } : {}),
    };
}

const assignUpcForPlatform = async (raw, variantsFlat) => {
    const brand = raw.brand ?? "";
    const description = raw.description ?? "";
    for (const v of variantsFlat) {
        if (!v.upc) continue;
        const upcRecord = await SkuToUpc.findOne({ upc: v.upc });
        if (!upcRecord) continue;
        await updateTempUpc(upcRecord, brand, description);
        if (!upcRecord.sku && v.sku) upcRecord.sku = v.sku;
        if (v.blank) upcRecord.blank = v.blank._id ?? v.blank;
        if (v.color) upcRecord.color = v.color._id ?? v.color;
        if (v.size) upcRecord.size = v.size.name ?? v.size;
        upcRecord.temp = false;
        upcRecord.hold = false;
        await upcRecord.save();
    }
    if (process.env.gs1PrimaryProductKey) {
        const tempCount = await SkuToUpc.countDocuments({ temp: true, hold: { $in: [false, null] } });
        if (tempCount < 1000 && !global._creatingTempUpcs) {
            global._creatingTempUpcs = true;
            createTempUpcs().finally(() => { global._creatingTempUpcs = false; });
        }
    }
};

export async function DELETE(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const { userName, email } = userFromToken(token);

    const url = new URL(req.url);
    const productId = url.searchParams.get("product");
    if (!productId) return NextResponse.json({ error: true, msg: "Missing product id" }, { status: 400 });

    try {
        const product = await PlatformProduct.findOneAndDelete({ _id: productId, orgId: token.orgId });
        if (!product) return NextResponse.json({ error: true, msg: "Product not found" }, { status: 404 });
        logActivity({ action: "product_delete", entity: "product", count: 1, userName, email });
        return NextResponse.json({ error: false });
    } catch (e) {
        console.error("[products DELETE]", e);
        return NextResponse.json({ error: true, msg: e.message });
    }
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { userName, email } = userFromToken(token);

    const body = await req.json();

    // Support both { product } (direct) and { products: [...] } (from CreateNFProduct modal)
    if (body.products) {
        const existingIds = body.products.filter(p => p._id).map(p => p._id);
        const beforeMap = {};
        if (existingIds.length > 0) {
            const existing = await PlatformProduct.find({ _id: { $in: existingIds } }).lean();
            for (const p of existing) beforeMap[String(p._id)] = p;
        }

        try {
            const saved = [];
            for (const raw of body.products) {
                const flatForUpc = flattenVariants(raw).length > 0 ? flattenVariants(raw) : (raw.variantsArray ?? []);
                await assignUpcForPlatform(raw, flatForUpc);
                const doc = await buildPlatformDoc(raw, token.orgId);
                let product;
                if (raw._id) {
                    product = await PlatformProduct.findByIdAndUpdate(raw._id, doc, { new: true });
                } else {
                    product = await PlatformProduct.create(doc);
                }
                saved.push(product);
            }

            logActivity({ action: "product_update", entity: "product", count: saved.length, userName, email });
            await Promise.all(saved.map(p =>
                logChange({
                    entityType: "product", entityId: p._id, entityName: p.sku || "",
                    action: beforeMap[String(p._id)] ? "update" : "create",
                    before: beforeMap[String(p._id)] ?? null, after: JSON.parse(JSON.stringify(p)),
                    userName, email, provider: "platform",
                })
            ));

            return NextResponse.json({ error: false, products: JSON.parse(JSON.stringify(saved)) });
        } catch (e) {
            console.error("[products POST products]", e);
            return NextResponse.json({ error: true, msg: e.message?.includes("duplicate") ? "SKU already exists" : e.message });
        }
    }

    const product = body.product ?? body;
    if (!product || typeof product !== "object") return NextResponse.json({ error: true, msg: "Invalid body" }, { status: 400 });
    product.orgId = token.orgId;

    try {
        const saved = await PlatformProduct.create(product);
        logActivity({ action: "product_update", entity: "product", count: 1, userName, email });
        return NextResponse.json({ error: false, product: JSON.parse(JSON.stringify(saved)) });
    } catch (e) {
        console.error("[products POST product]", e);
        return NextResponse.json({ error: true, msg: e.message?.includes("duplicate") ? "SKU already exists" : e.message });
    }
}
