import {NextApiRequest, NextResponse} from "next/server";
import {Design, Products} from "@pythias/mongo";
import { headers } from 'next/headers'
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
import { DesignSearch } from "@/functions/designSearch";
const createSku = ()=>{
    let sku = ""
    for(let i = 0; i < 10; i++){
        sku= `${sku}${letters[Math.floor(Math.random() * letters.length)]}`
    }
    return sku
}
export async function GET(req){
    let query= {q: req.nextUrl.searchParams.get("q"), page: req.nextUrl.searchParams.get("page")}
    try{
        let designs
        if(!query.q && !query == ""){
            if(query.page == undefined || query.page == 1){
                console.log("page = 1 or undefined")
                designs = await Design.find({}).sort({date: -1}).limit(48)
            }else{
                console.log("page > 1", (query.page - 1) * 48)
                designs = await Design.find({}).sort({date: -1}).skip((query.page - 1) * 48).limit(48)
            }
        }else{
            if(query.page == 1){
                designs = await Design.find({sku: {$regex: query.q, $options: "si"}}).limit(48)
                if(designs.length == 0) designs = await DesignSearch({q: query.q, page: query.page, productsPerPage: 48})
            }else{
                designs = await Design.find({sku: {$regex: query.q, $options: "si"}}).skip((query.page - 1) * 48).limit(48)
                if(designs.length == 0) designs = await DesignSearch({q: query.q, page: query.page, productsPerPage: 48})
            }
        }
        return NextResponse.json({error: false, designs})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}
export async function POST(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    let head = await headers()
    console.log(head.get("user"))
    //let user = JSON.parse(head.get("user"));
    //user = await User.findOne({userName: user.userName})
    try{
        let sku = createSku();
        let design = new Design({
            date: new Date(Date.now()), 
            images: {},
            //user: user._id,
            name: `${sku}-${Date.now()}`,
            sku: sku
        })
        console.log(design)
        design  = await design.save()
        return NextResponse.json({error: false, design})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    console.log(data.design.sendToMarketplaces, "send to market places ++++++++++++++++++++++++")
    try{  
        if(data.oldSku && data.oldSku != data.design.sku){
            console.log("updating products with new sku", data.oldSku, data.design.sku)
            let products = await Products.find({design: data.design._id})
            if(products.length > 0){
                console.log("products found with design, updating skus", products.length)
                for(let product of products){
                    for(let image of product.productImages){
                        image.image = image.image.replace(data.oldSku, data.design.sku)
                        image.sku = image.sku.replace(data.oldSku, data.design.sku)
                    }
                    let newVariantImages = {}
                    for(let key of Object.keys(product.variantImages)){
                        newVariantImages[key] = {}
                        for(let key2 of Object.keys(product.variantImages[key])){
                            newVariantImages[key][key2] = {}
                            newVariantImages[key][key2].image = product.variantImages[key][key2].image.replace(data.oldSku, data.design.sku)
                            newVariantImages[key][key2].sku = product.variantImages[key][key2].sku.replace(data.oldSku, data.design.sku)
                        }
                    }
                    product.variantImages = newVariantImages
                    let  newVariantSecondaryImages = {}
                    for (let key of Object.keys(product.variantSecondaryImages)) {
                        newVariantSecondaryImages[key] = {}
                        for (let key2 of Object.keys(product.variantSecondaryImages[key])) {
                            newVariantSecondaryImages[key][key2] = []
                            for(let image of product.variantSecondaryImages[key][key2]){
                                image.image = image.image.replace(data.oldSku, data.design.sku)
                                image.sku = image.sku.replace(data.oldSku, data.design.sku)
                                newVariantSecondaryImages[key][key2].push(image)
                            }
                        }
                    }
                    product.variantSecondaryImages = newVariantSecondaryImages
                    product.sku = product.sku.replace(data.oldSku, data.design.sku)
                    if(product.variantsArray.length > 0){
                        for(let variant of product.variantsArray){
                            variant.sku = variant.sku.replace(data.oldSku, data.design.sku)
                            variant.image = variant.image.replace(data.oldSku, data.design.sku)
                            let newImages = []
                            for (let image of variant.images) {
                                image = image.replace(data.oldSku, data.design.sku)
                                newImages.push(image)
                            }
                            variant.images = newImages
                        }
                    }
                    product.markModified("variantsArray variantsArray.images variantImages images sku variantSecondaryImages")
                    await product.save()
                }
            }
        }
        else console.log("skus are the same, no need to update products")
        let design = await Design.findOneAndUpdate({_id: data.design._id}, {...data.design})
        design = await Design.findOne({_id: design._id}).populate("blanks.blank blanks.colors blanks.defaultColor")
        return NextResponse.json({error: false, design})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}

export async function DELETE(req, res){
    console.log(await req.nextUrl.searchParams.get("design"))
    let design = await Design.findByIdAndDelete(req.nextUrl.searchParams.get("design"))
    return NextResponse.json({error: false})
}