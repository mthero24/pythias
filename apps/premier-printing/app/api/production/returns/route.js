import {Products, SkuToUpc, ProductInventory} from "@pythias/mongo"
import {NextApiRequest, NextResponse} from "next/server";

export async function POST(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    let product = await Products.findOne({ $or: [{ variantsArray: { $elemMatch: { sku: data.upc } } }, { variantsArray: { $elemMatch: { upc: data.upc } } }] }).populate("design", "sku images").populate("blanks", "sizes code multiImages images").populate("colors", "name").populate("variantsArray.blank variantsArray.color")
    console.log(product, "product found in returns bin route")
    if(!product){
        let skuToUpc = await SkuToUpc.findOne({ $or: [{sku: data.upc}, {upc: data.upc}]}) 
        console.log(skuToUpc, "skuToUpc")    
    }
    if(product){
        let variant = product.variantsArray.find(v => v.sku === data.upc || v.upc === data.upc)
        let productInventory = await ProductInventory.findOne({ sku: variant.sku })
        console.log(productInventory, "productInventory")
        if(!productInventory){
            variant.productInventory = new ProductInventory({
                quantity: 1,
                order_at_quantity: 0,
                pending_quantity: 0,
                quantity_to_order: 0,
                desired_order_quantity: 0,
                color: variant.color,
                blank: variant.blank,
                size: variant.size,
                unit_cost: variant.unit_cost,
                location: variant.location,
                sku: variant.sku
            })
            await variant.productInventory.save();
            await product.save();
            return NextResponse.json({error: false, msg: "Inventory created and updated", productInventory: variant.productInventory, variant})
        }else{
            productInventory.quantity += 1
            await productInventory.save()
            return NextResponse.json({ error: false, msg: "Inventory created and updated", productInventory: productInventory, variant })
        }
    }
    return NextResponse.json({error: true, msg: "Look up SKU or UPC on the design page!!!"})

}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    let inventory = await ProductInventory.findOneAndUpdate({_id: data.inventory._id}, data.inventory, {new: true})
    return NextResponse.json({error: false, inventory})
}
export async function DELETE(req){
    let binId = await req.nextUrl.searchParams.get("bin")
    let bin = await Bins.findOne({_id: binId}).populate("inventory.design", "sku images").populate("blank", "sizes code multiImages").populate("color", "name") 
    bin.blank = null
    bin.color = null
    bin.size = null
    bin.inventory = []
    bin.inUse = false
    await bin.save()
    let bins = await Bins.find({inUse: true}).populate("inventory.design", "sku images").populate("blank", "sizes code multiImages").populate("color", "name")
    //console.log(bin, "later bin")
    return NextResponse.json({error: false, bin, bins})
}