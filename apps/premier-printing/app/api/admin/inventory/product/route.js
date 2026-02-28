import { NextApiRequest, NextResponse } from "next/server";
import { ProductInventory, Products as Product } from "@pythias/mongo";


export async function POST(req = NextApiRequest,) {
    try {
        let body = await req.json();
        let product = await Product.findById(body.productId).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors variantsArray.productInventory variantsArray.color variantsArray.threadColor variantsArray.blank").populate({ path: "blanks", populate: "colors" });
        if (!product) {
            return NextResponse.json({ error: true, message: "Product not found" });
        }
        for (let variant of product.variantsArray) {
            variant.productInventory = await ProductInventory.findOne({ sku: variant.sku });
            if (!variant.productInventory) {
                variant.productInventory = new ProductInventory({
                    quantity: 0,
                    order_at_quantity: 0,
                    pending_quantity: 0,
                    quantity_to_order: 0,
                    desired_order_quantity: 0,
                    color: variant.color,
                    blank: variant.blank,
                    size: variant.size,
                    design: product.design,
                    sizeName: variant.blank.sizes.find(s => s._id.toString() === variant.size.toString())?.name || "",
                    colorName: variant.color.name,
                    blankCode: variant.blank.code,
                    designSku: product.design.sku,
                    unit_cost: variant.unit_cost,
                    location: variant.location,
                    sku: variant.sku
                })
            }
            await variant.productInventory.save();
        }
        product.markModified("variantsArray");
        await product.save();
        return NextResponse.json({ error: false, message: "Inventory created successfully", product });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: true, message: "Internal server error" });
    }
}
export async function PUT(req = NextApiRequest,) {
    let body = await req.json();
    let inventory = await ProductInventory.findOne({ _id: body.variant.productInventory._id });
    if (!inventory) {
        return NextResponse.json({ error: true, message: "Inventory not found" });
    }
    inventory.quantity = body.variant.productInventory.quantity;
    inventory.location = body.variant.productInventory.location;
    await inventory.save();
    let product = await Product.findById(body.productId).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors variantsArray.productInventory").populate({ path: "blanks", populate: "colors" });
    return NextResponse.json({ error: false, message: "Inventory updated successfully", product });
}