import {Products, Design} from "@pythias/mongo";
import {NextApiRequest, NextResponse } from "next/server";
import { updateTempUpc, createTempUpcs } from "@pythias/integrations"
import {SkuToUpc, Color} from "@pythias/mongo";

const update = async({product})=>{
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
    for (let product of data.products) {
        update({ product: product });
    }
    let products = [];
    for(let product of data.products) {
        if(product._id) {
            product = await Products.findByIdAndUpdate(product._id, product, { new: true, returnNewDocument: true}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({path:"blanks", populate: "colors"});
        }else{
            product = await Products.create(product)
            product = await Products.findById(product._id).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({path:"blanks", populate: "colors"});
        }
        products.push(product);
    }
    return NextResponse.json({ error: false, products });
}