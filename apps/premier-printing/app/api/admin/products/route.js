import { Products, Design, SkuToUpc, Inventory } from "@pythias/mongo";
import {NextApiRequest, NextResponse } from "next/server";
import { updateTempUpc, createTempUpcs } from "@pythias/integrations"
import { saveProducts, preCacheImages } from "@pythias/backend";
import { logActivity, userFromToken, logChange } from "@pythias/backend/server";
import { getToken } from "next-auth/jwt";
const assignUpc = async (upc, fields) => {
    const { sku, ...otherFields } = fields;
    Object.assign(upc, otherFields);
    if (!upc.sku && sku) upc.sku = sku; // SKU is permanent once assigned — never overwrite
    await upc.save();
};

const findUpcForVariant = async (sku, upcBarcode) => {
    // Prefer the record that already owns this SKU; fall back to the temp UPC barcode
    if (sku) {
        const bysku = await SkuToUpc.findOne({ sku });
        if (bysku) return bysku;
    }
    if (upcBarcode) return SkuToUpc.findOne({ upc: upcBarcode });
    return null;
};

const update = async({product})=>{
    if (product.threadColors && product.threadColors.length > 0) {
        for (let b of product.blanks) {
            for (let tc of product.threadColors) {
                for (let c of product.colors) {
                    if (product.variants[b.code] && product.variants[b.code][tc.name] && product.variants[b.code][tc.name][c.name] && product.variants[b.code][tc.name][c.name].length > 0) {
                        for (let v of product.variants[b.code][tc.name][c.name]) {
                            if (!v.upc && !v.sku) continue;
                            let upc = await findUpcForVariant(v.sku, v.upc);
                            if (!upc) continue;
                            updateTempUpc(upc, product.brand, product.productDescription);
                            await assignUpc(upc, {
                                design: product.design._id, blank: b._id, color: c._id,
                                size: v.size.name, temp: false, hold: false,
                                sku: v.sku, threadColor: tc._id,
                            });
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
                        if (!v.upc && !v.sku) continue;
                        let upc = await findUpcForVariant(v.sku, v.upc);
                        if (!upc) continue;
                        updateTempUpc(upc, product.brand, product.productDescription);
                        await assignUpc(upc, {
                            design: product.design?._id ?? product.design,
                            blank: b._id, color: c._id,
                            size: v.size.name, temp: false, hold: false,
                            sku: v.sku,
                        });
                    }
                }
            }
        }
    }
    let temSkus = await SkuToUpc.find({ temp: true, hold: { $in: [false, null] } }).countDocuments();
    if(temSkus < 1000 && !global._creatingTempUpcs) {
        global._creatingTempUpcs = true;
        createTempUpcs().finally(() => { global._creatingTempUpcs = false; });
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

    // Capture before states for products that already exist
    const existingIds = data.products.filter(p => p._id).map(p => p._id);
    const beforeMap = {};
    if (existingIds.length > 0) {
        const existing = await Products.find({ _id: { $in: existingIds } }).lean();
        for (const p of existing) beforeMap[String(p._id)] = p;
    }

    for (let product of data.products) {
        if (product.variants) await update({ product: product });
        if(product.isNFProduct && product.variantsArray) {
            await updateArray({ product: product });
            product.variantsArray.map(v=> {
                v.size = v.size._id? v.size._id: v.size
                return v
            })
        }
    }
    let products = await saveProducts({ products: data.products, Products, Inventory });
    logActivity({ action: "product_update", entity: "product", count: data.products.length, userName, email });

    // Log changes for each product
    await Promise.all((products || data.products).map(p =>
        logChange({
            entityType: "product", entityId: p._id, entityName: p.sku || "",
            action: beforeMap[String(p._id)] ? "update" : "create",
            before: beforeMap[String(p._id)] ?? null, after: p,
            userName, email, provider: "premierPrinting",
        })
    ));

    return NextResponse.json({ error: false, products });
}
export async function PUT(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const data = await req.json();
    console.log("Updating product", data.product._id);
    const oldProduct = await Products.findById(data.product._id).lean();
    let product = await Products.findByIdAndUpdate(data.product._id, data.product, { new: true, returnNewDocument: true }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    console.log("Updated product", product);
    logActivity({ action: "product_update", entity: "product", entityId: product?._id, entityName: product?.sku || "", userName, email });
    await logChange({ entityType: "product", entityId: product?._id, entityName: product?.sku || data.product?.sku || "", action: "update", before: oldProduct, after: data.product, userName, email, provider: "premierPrinting" });
    return NextResponse.json({ error: false, product });
}
export async function DELETE(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
    const product = req.nextUrl.searchParams.get("product");
    let prod = await Products.findOneAndDelete({ _id: product }).lean();
    logActivity({ action: "product_delete", entity: "product", entityId: product, entityName: prod?.sku || "", userName, email });
    logChange({ entityType: "product", entityId: product, entityName: prod?.sku || "", action: "delete", before: prod, after: null, userName, email, provider: "premierPrinting" });
    return NextResponse.json({ error: false });
}