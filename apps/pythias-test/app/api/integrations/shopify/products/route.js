import User from "@/models/User";
import Design from "@/models/Design";
import {NextApiRequest, NextResponse} from "next/server";
import { headers } from "next/headers";
import SkuToUpc from "@/models/skuUpcConversion";
import { createUpc } from "@/functions/createUpcs";
const doUPC = async ({design, blank})=>{
    let soemthing = await createUpc({design, blank})
    return soemthing
}
const createProducts = async (design, brand)=>{
    let products = []

    for(let b of design.blanks){
        if(b.blank && ((brand == "The Juniper Shop" && b.blank.department.toLowerCase() == "kids") || (brand== "Simply Sage Market" && b.blank.department.toLowerCase() != "kids") || (brand != "The Juniper Shop" && brand != "Simply Sage Market"))){
            let skus = await SkuToUpc.find({design: design._id, blank: b.blank._id})
            if(skus.length < (b.colors.length * b.blank.sizes.length)) await doUPC({design, blank: b.blank._id})
            let product = {
                design,
                blank: b.blank,
                colors: b.colors,
                defaultColor: b.defaultColor,
                defaultImages: b.defaultImages,
                variants: await SkuToUpc.find({design: design._id, blank: b.blank._id})
            }
            //console.log(product)
            products.push(product)
        }
    }
    return products
}
export async function GET(req=NextApiRequest){
    const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    console.log("Authorization:", authorizationHeader);
    let password = authorizationHeader.split(" ")[1]
    console.log(password)
    let user = await User.findOne({password: password})
    console.log(user)
    if(user){
        let brand = req.nextUrl.searchParams.get("brand")
        console.log(brand)
        let designsTotal = await Design.find({"b2m.brand": brand, onShopify: {$in: [null, false]}, published: true}).countDocuments()
        console.log(designsTotal)
        let designs = await Design.find({"b2m.brand": brand, onShopify: {$in: [null, false]}, published: true}).limit(5).populate("blanks.blank blanks.colors");
        let products = []
        for(let d of designs){
            products = products.concat(await createProducts(d, brand))
        }
        console.log(products.length)
        return NextResponse.json({error: false, products})
    }
    return NextResponse.json({error: true, msg: "User does not exist"});
}
// async function products(req, res){
//     console.log(req.user)
//     if(req.method == "GET"){
//         let user = await User.findById(req.user._id)
//         console.log(user)
//         let products = await Products.find({user: user._id}).populate("style design colors").limit(10)
//         console.log(products.length)
//         return res.send({error: false, products})
//     }
//     return res.send({error: false})
// }
// export default isLoggedIn(products);