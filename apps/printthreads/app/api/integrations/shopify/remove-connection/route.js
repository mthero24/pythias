import {Products, User, MarketPlaces, ApiKeyIntegrations} from "@pythias/mongo";
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
        let marketplace = await MarketPlaces.findOne({ name: "shopify" });
        let connection = await ApiKeyIntegrations.findOneAndDelete({ displayName: `shopify-${data.shop}` });
        marketplace.connections = marketplace.connections.filter(c => c.toString() !== connection._id.toString());
        await marketplace.save();
        let products = await Products.find({ marketPlacesArray: marketplace._id, ids: { $exists: true, $ne: {} } });
        for(let product of products){
            product.marketPlacesArray = product.marketPlacesArray.filter(m => m.toString() !== marketplace._id.toString());
            let newIds = {};
            for(let id of Object.keys(product.ids)){
                if(id !== `shopify-${data.shop}`){
                    newIds[id] = product.ids[id];
                }
            }
            product.ids = newIds;
            for(let v of product.variantsArray){
                newIds = {};
                for(let id of Object.keys(v.ids)){
                    if (id !== `shopify-${data.shop}`){
                        newIds[id] = v.ids[id];
                    }
                }
                v.ids = newIds;
            }
            product.markModified("ids marketplaces variantsArray");
            await product.save();
        }
        return NextResponse.json({error: false, msg: "uninstalled shopify integration"});
    }
    return NextResponse.json({error: true, msg: "User does not exist"});
    // Find the product by its ID

}