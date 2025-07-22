import {Products, Design} from "@pythias/mongo";
import {NextApiRequest, NextResponse } from "next/server";
import { updateTempUpc, createTempUpcs } from "@pythias/integrations"
import {SkuToUpc, Color} from "@pythias/mongo";

const update = async({product})=>{
    console.log("Updating product", product._id);
    let upcs = await SkuToUpc.find({ createdAt: { $ne: null }, temp: false })
    for (let upc of upcs) {
        upc.markModified("sku")
        console.log(upc.sku.includes("__"))
        upc.sku = upc.sku.replace("__", "_")
        console.log(upc.sku)
        await upc.save()
    }
    if (product.threadColors && product.threadColors.length > 0) {
        for (let b of product.blanks) {
            for (let tc of product.threadColors) {
                for (let c of product.colors) {
                    if (product.variants[b.code] && product.variants[b.code][tc.name] && product.variants[b.code][tc.name][c.name] && product.variants[b.code][tc.name][c.name].length > 0) {
                        for (let v of product.variants[b.code][tc.name][c.name]) {
                            //console.log("Updating variant", v.upc);
                            let upc = await SkuToUpc.findOne({ upc: v.upc });
                            //console.log("Found UPC", upc);
                            upc.design = product.design._id;
                            upc.blank = b._id;
                            upc.color = c._id;
                            upc.size = v.size.name;
                            upc.temp = false;
                            upc.hold = false;
                            upc.sku = v.sku;
                            upc.threadColor = tc._id;
                            updateTempUpc(upc, product.brand, product.productDescription)
                            await upc.save();
                        }
                    }
                }
            }
        }
    }else {
        for (let b of product.blanks) {
            for (let c of product.colors) {
                if (product.variants[b.code] && product.variants[b.code][c.name] && product.variants[b.code][c.name].length > 0) {
                    for (let v of product.variants[b.code][c.name]) {
                        console.log("Updating variant", v.gtin, v.sku);
                        let upc = await SkuToUpc.findOne({ upc:v.upc });
                        console.log("Found UPC", upc);
                        upc.design = product.design._id;
                        upc.blank = b._id;
                        upc.color = c._id;
                        upc.size = v.size.name;
                        upc.temp = false;
                        upc.hold = false;
                        upc.sku = v.sku;
                        updateTempUpc(upc, product.brand, product.productDescription)
                        await upc.save();
                    }
                }
            }
        }
    }
    let temSkus = await SkuToUpc.find({ temp: true, hold: { $in: [false, null] } }).countDocuments();
    if(temSkus < 1000) { 
        createTempUpcs();
    }
}
export async function POST(req = NextApiRequest) {
    const data = await req.json();
    console.log("Received data", data);
    update({product: data.product});
    let product
    if(data.product._id) {
        product = await Products.findByIdAndUpdate(data.product._id, data.product, { new: true, returnNewDocument: true}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({path:"blanks", populate: "colors"});
    }else{
        product = await Products.create(data.product);
    }
    return NextResponse.json({ error: false, product });
}