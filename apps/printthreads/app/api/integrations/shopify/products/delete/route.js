import {Products, User, MarketPlaces} from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";
import { headers } from "next/headers";
export async function POST(req = NextApiRequest) {
    let data = await req.json();
    console.log(data);
     const headersList = await headers();
    const authorizationHeader = headersList.get("authorization");
    console.log("Authorization:", authorizationHeader);
    let password = authorizationHeader.split(" ")[1]
    console.log(password)
    let user = await User.findOne({password: password})
    console.log(user)
    if(user){
        let product = await Products.findById(data.id);
        if (product) {
            let newIds = {}
            for(let id of Object.keys(product.ids)){
                if(id != `shopify-${data.shop}`){
                    newIds[id] = product.ids[id]
                }
            }
            product.ids = newIds;
            for(let v of product.variantsArray){
                newIds = {}
                for(let id of Object.keys(v.ids)){
                    if (id != `shopify-${data.shop}`){
                        newIds[id] = v.ids[id]
                    }
                }
                v.ids = newIds;
            }
            let marketplace = await MarketPlaces.findOne({name: "shopify"});
            if(marketplace){
                product.marketPlacesArray = product.marketPlacesArray.filter(m => m.toString() != marketplace._id.toString());
            }
        }
        console.log(product.ids, product.marketPlacesArray, "product ids")
        product.markModified("ids marketplaces variantsArray");
        await product.save();
        return NextResponse.json({error: false, msg: "Product deleted from Shopify"});
    }
    return NextResponse.json({error: true, msg: "User does not exist"});
    // Find the product by its ID

}