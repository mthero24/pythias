import { Products, Design, SkuToUpc, Inventory } from "@pythias/mongo";
import {NextApiRequest, NextResponse } from "next/server";
import { updateTempUpc, createTempUpcs } from "@pythias/integrations"
import { saveProducts, preCacheImages } from "@pythias/backend";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";
import { getToken } from "next-auth/jwt";
const update = async({product})=>{
    if (product.threadColors && product.threadColors.length > 0) {
        for (let b of product.blanks) {
            for (let tc of product.threadColors) {
                for (let c of product.colors) {
                    if (product.variants[b.code] && product.variants[b.code][tc.name] && product.variants[b.code][tc.name][c.name] && product.variants[b.code][tc.name][c.name].length > 0) {
                        for (let v of product.variants[b.code][tc.name][c.name]) {
                            console.log("Updating variant", v.upc);
                            let upc = await SkuToUpc.findOne({ upc: v.upc });
                            console.log("Found UPC", upc);
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
                        let upc = await SkuToUpc.findOne({ upc: v.upc });
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
let updateArray = async({product})=>{
    for(let v of product.variantsArray){
        let upc = await SkuToUpc.findOne({ upc: v.upc });
        console.log("Found UPC", upc);
        if(upc){
            upc.blank= v.blank._id,
            upc.color= v.color._id,
            upc.size= v.size.name,
            upc.temp= false,
            upc.hold= false,
            upc.sku= v.sku,
            updateTempUpc(upc, product.brand, product.productDescription)
            await upc.save();
        }
    }
}
export async function GET(req = NextApiRequest) {
    const product = req.nextUrl.searchParams.get("products");
    if (!product) {
        return NextResponse.json({ error: true, message: "Product ID is required" });
    }
    const productData = await Products.find({ _id: { $in: product.split(",") } }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" }).lean();
    if (!productData) {
        for(let p of productData){
            preCacheImages(p);
        }
        return NextResponse.json({ error: true, message: "Product not found" });
    }
    return NextResponse.json({ error: false, products: productData });
}
export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const data = await req.json();
    let products = await saveProducts({ products: data.products, Products, Inventory });
    logActivity({ action: "product_update", entity: "product", count: data.products.length, userName, email, provider: "pythiasTest" });
    return NextResponse.json({ error: false, products });
}
export async function PUT(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const data = await req.json();
    console.log("Updating product", data.product._id);
    const oldProduct = await Products.findById(data.product._id).lean();
    let product = await Products.findByIdAndUpdate(data.product._id, data.product, { new: true, returnNewDocument: true });
    product = await Products.findById(product._id).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors variantsArray.productInventory").populate({ path: "blanks", populate: "colors" });
    console.log("Updated product", product);
    logActivity({ action: "product_update", entity: "product", entityId: product?._id, entityName: product?.sku || "", userName, email, provider: "pythiasTest" });
    await logChange({ entityType: "product", entityId: product?._id, entityName: product?.sku || data.product?.sku || "", action: "update", before: oldProduct, after: data.product, userName, email, provider: "pythiasTest" });
    return NextResponse.json({ error: false, product });
}
export async function DELETE(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const product = req.nextUrl.searchParams.get("product");
    let prod = await Products.findOneAndDelete({ _id: product });
    logActivity({ action: "product_delete", entity: "product", entityId: product, entityName: prod?.sku || "", userName, email, provider: "pythiasTest" });
    return NextResponse.json({ error: false });
}