import {NextApiRequest, NextResponse} from "next/server"
import { TikTokAuth, SkuToUpc, Design, Blank as Blanks } from "@pythias/mongo";
import { createTikTokProduct } from "@/functions/tikTok";
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

    const hires = (url) => url?.replace(/(\?|&)width=\d+/, '$1width=2400') ?? url;

    const product = {
        name:        p.title,
        description: p.description,
        design:      p.design,
        blank:       p.blanks?.[0] ? { ...p.blanks[0], sizeGuide: p.blanks[0].sizeGuide ? { ...p.blanks[0].sizeGuide, images: (p.blanks[0].sizeGuide.images ?? []).map(hires) } : undefined } : undefined,
        images:      (p.productImages ?? []).map(pi => hires(pi.image)).filter(Boolean),
        variants:    (p.variantsArray ?? []).map(v => ({
            color:  v.color,
            size:   v.size?.name ?? v.size,
            sku:    v.sku,
            upc:    v.upc,
            price:  v.price,
            images: [v.image, ...(v.images ?? [])].filter(Boolean).map(hires),
        })),
    };

    const result = await createTikTokProduct({ product });
    return NextResponse.json({ error: false, tiktokProductId: result?.tiktokProductId });
}