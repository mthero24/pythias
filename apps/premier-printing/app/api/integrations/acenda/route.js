import {Products, SkuToUpc, ApiKeyIntegrations} from "@pythias/mongo";
import { NextApiRequest, NextResponse } from "next/server";
import { getSkuAcenda, addInventoryAcenda } from "@pythias/integrations";

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
            }else{
                let skuToUpc = await SkuToUpc.findOne({ sku: variant.sku });
                if(skuToUpc && skuToUpc.upc) {
                    console.log("Using SKU from SkuToUpc:", skuToUpc);
                    if(skuToUpc && skuToUpc.previousSkus && skuToUpc.previousSkus.length > 0) {
                        for(let previousSku of skuToUpc.previousSkus) {
                            let res = await getSkuAcenda({sku: previousSku, clientId: body.connection.apiKey, clientSecret: body.connection.apiSecret, organization: body.connection.organization});
                            if(res && res[0] && res[0].id){
                                console.log("Received SKU from Acenda for previous SKU:", res[0].id);
                                variant.ids["acenda"] = res[0].id;
                                acendaProductSku = res[0].group_skus[0];
                                break;
                            }
                        }
                    }
                    
                }
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

export async function GET(req = NextApiRequest) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const prods = searchParams.get("prods")
    const connectionId = searchParams.get("connectionId");
    const product = await Products.findOne({ _id: productId }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    //console.log(prods)
    const products = await Products.find({ _id: { $in: prods.split(",") } }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    //console.log("Product found:", product);
    //console.log(products.length, "products")
    const connection = await ApiKeyIntegrations.findOne({ _id: connectionId });
    //console.log("Connection found:", connection);
    if(products && products.length > 0){
        for(let prod of products){
            //console.log("Product found:", prod);
            let inventory = []
            for (let variant of prod.variantsArray) {
                inventory.push({
                    quantity: 1000,
                    sku: variant.sku,
                    tracking: "basic",
                    warehouse_id: 1
                })
            }
            await addInventoryAcenda({ clientId: connection.apiKey, clientSecret: connection.apiSecret, organization: connection.organization, inventory })
        }
        return NextResponse.json({ error: false, products }, { status: 200 });
    }
    if (!product || !connection) {
        return NextResponse.json({ error: true, message: "Product not found" }, { status: 404 });
    }else {
        let inventory = []
        for(let variant of product.variantsArray){
            inventory.push({
                quantity: 1000,
                sku: variant.sku,
                tracking: "basic",
                warehouse_id: 1
            })
        }
        await addInventoryAcenda({ clientId: connection.apiKey, clientSecret: connection.apiSecret, organization: connection.organization, inventory })
        return NextResponse.json({ error: false, product }, { status: 200 });
    }
}