import {NextApiRequest, NextResponse} from "next/server"
import { TikTokAuth, SkuToUpc, Design, Blank as Blanks } from "@pythias/mongo";
import { createTikTokProduct, getTikTokAttributes } from "@/functions/tikTok";
const createVariants = async ({design, b, blank})=>{
    let vs = await SkuToUpc.find({design: design._id, blank: blank._id})
    let skus = []
    let vars = []
    for(let c of b.colors){
        for(let s of blank.sizes){
            let sku= `${blank.code}_${c.name}_${s.name}_${design.sku}`
            let v = vs.filter(v => v.sku == sku)[0]
            let images = []
            for(let key of Object.keys(design.images)){
                let styleImages = blank.multiImages[key]
                let filteredStyleImages = styleImages.filter(si=> si.color == c._id.toString() && si.imageGroup.includes(design.imageGroup))
                if(filteredStyleImages .length < 1){
                    filteredStyleImages  = styleImages.filter(si=> si.color == c._id.toString() && si.imageGroup.includes("default"))
                }
                if(images.length < 9){
                    for(let im of filteredStyleImages){
                        images.push(`${process.env.NEXTAUTH_URL}/api/renderImages/${blank.code}-${c.name}-${design.sku}-${key}.jpg?blank=${blank.code}&blankImage=${im.image}&colorName=${c.name}&design=${design.images[key]}&side=${key}&width=2400`)
                    }
                }
            }
            if(v) {
                v.color = c
                v.images = images
                v.price =s.retailPrice
                vars.push(v)
            }else {
                vars.push({
                    sku: sku,
                    color: c,
                    size: s.name,
                    price: s.retailPrice,
                    images
                })
            }
        }
    }
   //console.log(vars)
    return vars
}

const createProduct = async ({design, b, blanks})=>{
    let blank= blanks.filter(bl=> bl._id.toString() == b.blank.toString())[0]
    let product = {
        name: `${design.name} ${blank.name}`,
        description: `<p>${design.description}</p> <p>${blank.description}</p>`,
        design: design,
        blankObj: b,
        blank: blank
    }
    let images = []
    if(product.blankObj.defaultColor){
        for(let key of Object.keys(design.images)){
            let styleImages = product.blank.multiImages[key]
            let filteredStyleImages = styleImages.filter(si=> si.color == product.blankObj.defaultColor._id.toString() && si.imageGroup.includes(design.imageGroup))
            if(filteredStyleImages .length < 1){
                filteredStyleImages  = styleImages.filter(si=> si.color == product.blankObj.defaultColor._id.toString() && si.imageGroup.includes("default"))
            }
            //console.log(filteredStyleImages[0], filteredStyleImages.length)
            for(let im of filteredStyleImages){
                images.push(`${process.env.NEXTAUTH_URL}/api/renderImages/${product.blank.code}-${product.blankObj.defaultColor.name}-${design.sku}-${key}.jpg?blank=${product.blank.code}&blankImage=${im.image}&colorName=${product.blankObj.defaultColor.name}&design=${design.images[key]}&side=${key}&width=2400`)
            }
        }    
    }
    for(let c of (product.blankObj.defaultColor? product.blankObj.colors.filter(c=> c._id.toString() != product.blankObj.defaultColor._id.toString()): product.blankObj.colors)){
       //console.log(c, design.imageGroup)
        for(let key of Object.keys(design.images)){
            let styleImages = product.blank.multiImages[key]
            let filteredStyleImages = styleImages.filter(si=> si.color == c._id.toString() && si.imageGroup.includes(design.imageGroup))
            if(filteredStyleImages .length < 1){
                filteredStyleImages  = styleImages.filter(si=> si.color == c._id.toString() && si.imageGroup.includes("default"))
            }
            //onsole.log(filteredStyleImages[0], filteredStyleImages.length)
            if(images.length < 9){
                for(let im of filteredStyleImages){
                    images.push(`${process.env.NEXTAUTH_URL}/api/renderImages/${product.blank.code}-${c.name}-${design.sku}-${key}.jpg?blank=${product.blank.code}&blankImage=${im.image}&colorName=${c.name}&design=${design.images[key]}&side=${key}&width=2400`)
                }
            }
        }
    }
    product.images = images
    product.variants = await createVariants({design, b, blank})
    return product
}

export async function POST(req=NextApiRequest){
    const data = await req.json();
    const p = data.product;
    const marketplaceName = data.marketplaceName ?? null;

    const hires = (url) => url?.replace(/(\?|&)width=\d+/, '$1width=2400') ?? url;

    // Fetch the full blank from DB so all fields are guaranteed present, then overlay any
    // marketplace overrides / bullet points the user set in the modal but didn't persist to
    // the Blank document — otherwise the DB copy silently discards those fresh selections.
    const blankId = p.blanks?.[0]?._id ?? p.blanks?.[0];
    const fullBlank = blankId ? await Blanks.findById(blankId).lean() : null;
    const sentBlank = p.blanks?.[0] && typeof p.blanks[0] === "object" ? p.blanks[0] : null;
    const baseBlank = fullBlank ?? sentBlank;
    const blankData = baseBlank ? {
        ...baseBlank,
        // Deep-merge marketPlaceOverrides per marketplace name; the sent (modal-edited) values win.
        marketPlaceOverrides: (() => {
            const dbOv = baseBlank.marketPlaceOverrides ?? {};
            const sentOv = sentBlank?.marketPlaceOverrides ?? {};
            const merged = { ...dbOv };
            for (const [mp, vals] of Object.entries(sentOv)) {
                merged[mp] = { ...(dbOv[mp] ?? {}), ...(vals ?? {}) };
            }
            return merged;
        })(),
        // Prefer modal-edited bullet points when the frontend provides any.
        bulletPoints: (sentBlank?.bulletPoints?.length ? sentBlank.bulletPoints : baseBlank.bulletPoints),
    } : null;

    // Extract product-specific marketplace values for this TikTok marketplace
    const tiktokMp = (p.marketPlacesArray ?? []).find(m =>
        (m.name ?? "").toLowerCase() === (marketplaceName ?? "").toLowerCase()
    );
    const tiktokMpId = tiktokMp?._id?.toString() ?? tiktokMp?.toString();
    const marketplaceValues = (tiktokMpId && p.marketplaceValues?.[tiktokMpId])
        ? p.marketplaceValues[tiktokMpId]
        : {};

    const product = {
        name:              p.title,
        brand:             p.brand ?? null,
        description:       p.description,
        tags:              p.tags ?? [],
        design:            p.design,
        blank:             blankData ? { ...blankData, sizeGuide: blankData.sizeGuide ? { ...blankData.sizeGuide, images: (blankData.sizeGuide.images ?? []).map(hires) } : undefined } : undefined,
        images:            (p.productImages ?? []).map(pi => hires(pi.image)).filter(Boolean),
        variants:          (p.variantsArray ?? []).map(v => ({
            color:  v.color,
            size:   v.size?.name ?? v.size,
            sku:    v.sku,
            upc:    v.upc,
            price:  v.price,
            images: [v.image, ...(v.images ?? [])].filter(Boolean).map(hires),
        })),
        marketplaceValues,
        packageLength:     p.packageLength ?? null,
        packageWidth:      p.packageWidth  ?? null,
        packageHeight:     p.packageHeight ?? null,
    };

    const result = await createTikTokProduct({ product, marketplaceName });
    return NextResponse.json({ error: false, tiktokProductId: result?.tiktokProductId, warning: result?.warning ?? null });
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("productName") || "t-shirt";
    const result = await getTikTokAttributes(productName);
    if (result.error) return NextResponse.json({ error: true, msg: result.msg }, { status: 400 });
    return NextResponse.json(result);
}

export async function PATCH(req) {
    const { shopId, pullOrders } = await req.json();
    if (!shopId) return NextResponse.json({ error: true, msg: "shopId required" }, { status: 400 });
    await TikTokAuth.findByIdAndUpdate(shopId, { pullOrders });
    return NextResponse.json({ error: false });
}