import {Products, MarketPlace} from "@pythias/mongo";
import { NextApiRequest, NextResponse } from "next/server";
import { getSkuAcenda } from "@pythias/integrations";

export async function POST(req = NextApiRequest) {
    const body = await req.json();
    console.log("Received body:", body);
    let product = await Products.findOne({ _id: body.product._id }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    let acendaProductSku 
    for(let variant of product.variantsArray) {
        if(!variant.ids) variant.ids = {};
        if(!variant.ids["acenda"]) {
            console.log("Checking SKU for variant:", variant.sku);
            let res = await getSkuAcenda({sku: variant.sku, clientId: body.connection.apiKey, clientSecret: body.connection.apiSecret, organization: body.connection.organization});
            if(res && res[0] && res[0].id){
                //console.log("Received SKU from Acenda:", res[0].id);
                variant.ids["acenda"] = res[0].id;
                acendaProductSku = res[0].group_skus[0];
            }
        }
    }
    if (!product.ids) product.ids = {};
    if(!product.ids["acenda"]) {
        let acendaProduct = await getSkuAcenda({ sku: product.sku, clientId: body.connection.apiKey, clientSecret: body.connection.apiSecret, organization: body.connection.organization });
        if (acendaProductSku && (!acendaProduct || !acendaProduct[0] || !acendaProduct[0].id)){
            acendaProduct = await getSkuAcenda({ sku: acendaProductSku, clientId: body.connection.apiKey, clientSecret: body.connection.apiSecret, organization: body.connection.organization });
        }
        if (acendaProduct && acendaProduct[0] && acendaProduct[0].id){
            product.ids["acenda"] = acendaProduct[0].id;
        }
    }
    product.markModified("variantsArray ids");
    product = await product.save();
    // Do something with the SKU
    return NextResponse.json({ error: false, product }, { status: 200 });
}