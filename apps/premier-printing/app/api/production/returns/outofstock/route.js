import {Products, SkuToUpc, ProductInventory, Item, Inventory} from "@pythias/mongo"
import {NextApiRequest, NextResponse} from "next/server";
import { initMetadata } from "pdfkit";

export async function POST(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    let product = await Products.findOne({ $or: [{ variantsArray: { $elemMatch: { sku: data.upc } } }, { variantsArray: { $elemMatch: { upc: data.upc } } }] }).populate("design", "sku images").populate("blanks", "sizes code multiImages images").populate("colors", "name").populate("variantsArray.blank variantsArray.color")
    console.log(product, "product found in returns bin route")
    if(product){
        let variant = product.variantsArray.find(v => v.sku === data.upc || v.upc === data.upc)
        let productInventory = await ProductInventory.findOne({ sku: variant.sku })
        console.log(productInventory, "productInventory")
        productInventory.quantity = 0
        await productInventory.save()
        return NextResponse.json({ error: false, msg: "Inventory created and updated", productInventory: productInventory, variant })
    }
    return NextResponse.json({error: true, msg: "Look up SKU or UPC on the design page!!!"})

}
export async function POST(req = NextApiRequest) {
    let data = await req.json()
    console.log(data)
    let item = await Item.findOne({ upc: data.upc })
    item.inventory.inventoryType = "inventory"
    item.inventory.productInventory = null
    item.inventory.inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size })
    item.printed = false
    item.steps.push({ step: "sent to production", date: new Date() })
    await item.save()
    let product = await Products.findOne({ $or: [{ variantsArray: { $elemMatch: { sku: item.sku } } }] }).populate("design", "sku images").populate("blanks", "sizes code multiImages images").populate("colors", "name").populate("variantsArray.blank variantsArray.color")
    console.log(product, "product found in returns bin route")
    if (product) {
        let variant = product.variantsArray.find(v => v.sku === data.upc || v.upc === data.upc)
        let productInventory = await ProductInventory.findOne({ sku: variant.sku })
        console.log(productInventory, "productInventory")
        productInventory.quantity = 0
        await productInventory.save()
        return NextResponse.json({ error: false, msg: "Inventory created and updated", productInventory: productInventory, variant })
    }
    return NextResponse.json({ error: true, msg: "Look up SKU or UPC on the design page!!!" })

}