import {NextApiRequest, NextResponse} from "next/server"
import TikTokAuth from "@/models/tiktok";
import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Blanks from "@/models/Blanks"
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
                        images.push(`https://simplysage.pythiastechnologies.com/api/renderImages/${blank.code}-${c.name}-${design.sku}-${key}.jpg?blank=${blank.code}&blankImage=${im.image}&colorName=${c.name}&design=${design.images[key]}&side=${key}&width=2400`)
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
                images.push(`https://simplysage.pythiastechnologies.com/api/renderImages/${product.blank.code}-${product.blankObj.defaultColor.name}-${design.sku}-${key}.jpg?blank=${product.blank.code}&blankImage=${im.image}&colorName=${product.blankObj.defaultColor.name}&design=${design.images[key]}&side=${key}&width=2400`)
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
                    images.push(`https://simplysage.pythiastechnologies.com/api/renderImages/${product.blank.code}-${c.name}-${design.sku}-${key}.jpg?blank=${product.blank.code}&blankImage=${im.image}&colorName=${c.name}&design=${design.images[key]}&side=${key}&width=2400`)
                }
            }
        }
    }
    product.images = images
    product.variants = await createVariants({design, b, blank})
    return product
}

export async function POST(req=NextApiRequest){
    let blanks = await Blanks.find({}).select("colors code name sizes multiImages sizeGuide").populate("colors").lean();
    const data = await req.json();
    console.log(data, "Data")
    let design = await Design.findById(data.design).populate("blanks.colors blanks.defaultColor")
    let products = []
    for(let b of design.blanks){
        if(data.blank && b._id.toString() == data.blank.toString()){
            products.push(await createProduct({design, b, blanks}))
        }else if(!data.blank){
            products.push(await createProduct({design, b, blanks}))
        }
    }
    
    console.log(products[0], products.length)
    for(let product of products){
        createTikTokProduct({product})
    }
    return NextResponse.json({error: false})
}