import { Design, Items as Item, Blank, Color, Order, Products, SkuToUpc, Inventory, ProductInventory } from "@pythias/mongo";
import { getOrders, generatePieceID } from "@pythias/integrations";
import Blanks from "@/models/Blanks";
import { options } from "pdfkit";
const createItem = async (i, order, blank, color, threadColor, size, design, sku) => {
    console.log(size, "size")
    let item = new Item({ pieceId: await generatePieceID(), 
        paid: true, 
        sku: sku, 
        orderItemId: i.orderItemId, 
        blank: blank, 
        styleCode: blank?.code, 
        sizeName: size?.name, 
        threadColorName: threadColor?.name, 
        threadColor: threadColor, 
        colorName: color?.name, 
        color: color, 
        size: size, 
        design: threadColor ? design.threadImages[threadColor?.name] : design?.images, 
        designRef: design, 
        order: order._id, 
        shippingType: order.shippingType, 
        quantity: 1, 
        status: order.status, 
        name: i.name, 
        date: order.date, 
        type: design?.printType, 
        upc: i.upc, 
        options: i.options[0]?.value 
    })
    console.log(i, "item to save")
    let productInventory = await ProductInventory.findOne({ sku: i.sku })
    if (productInventory) {
        if (productInventory.quantity > 0) {
            item.inventory = { type: "productInventory", ProductInventory: productInventory._id }
            productInventory.quantity -= 1
            await productInventory.save()
        }
    } else {
        let inventory = await Inventory.findOne({ blank: blank?._id, color: color ? color._id : null, sizeId: size?._id? size._id.toString(): size?.toString() })
        if (inventory) {
            if (inventory.quantity > 0) {
                inventory.quantity -= 1
                await inventory.save()
                item.inventory = { type: "inventory", Inventory: inventory._id }
            } else {
                if (!inventory.attached) inventory.attached = []
                inventory.attached.push(item._id)
                await inventory.save()
            }
        }
    }
    await item.save();
    return item
}
export async function pullOrders(){
    console.log("pull orders")
    let orders = await getOrders({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`})
    for(let o of orders){
        console.log(o.orderStatus, o.orderDate)
        let order = await Order.findOne({orderId: o.orderId}).populate("items")
        if(!order){
            let marketplace = o.orderNumber.toLowerCase().includes("cs")? "customer service entry": o.advancedOptions.source? o.advancedOptions.source: o.billTo.name
            order = new Order({orderId: o.orderId, poNumber: o.orderNumber, orderKey: o.orderKey, date: o.orderDate, status: o.orderStatus,
                uniquePo: `${o.orderNumber}-${o.orderId}-${o.advancedOptions.source? o.advancedOptions.source: o.billTo.name}`,
                shippingAddress: {
                    name: o.shipTo.name,
                    address1: o.shipTo.street1? o.shipTo.street1: "not provided",
                    address2: o.shipTo.street2,
                    city: o.shipTo.city? o.shipTo.city: "not provided",
                    zip: o.shipTo.postalCode?  o.shipTo.postalCode: "not provided",
                    state: o.shipTo.state? o.shipTo.state: "not provided",
                    country: o.shipTo.country? o.shipTo.country: "not provided"
                },
                shippingType: marketplace == "faire" || marketplace == "TSC" || marketplace == "Zulily"? "Expedited": "Standard",
                marketplace: o.orderNumber.toLowerCase().includes("cs")? "customer service entry": o.advancedOptions.source? o.advancedOptions.source: o.billTo.name,
                total: o.orderTotal,
                paid: true
            })
            if(o.customerNotes){
                console.log(o.customerNotes.split("<br/>"))
                let notesObj = {}
                o.customerNotes.split("<br/>").map(b=>{
                    let sp = b.split(":")
                    notesObj[sp[0].toLowerCase().replace(/ /g, "_").trim()] = sp[1].trim()
                })
                console.log(notesObj)
                if(notesObj.order_placed_from == "Kohl's"){
                    order.marketplace = "kohls"
                    order.poNumber= notesObj.order_id
                } 
                if(notesObj.channel == "shein"){
                    order.marketplace = "shein"
                    order.poNumber= notesObj.source_order_id
                }
                console.log(order.poNumber, order.marketplace)
                //await order.save()
                
            }
            let items = []
            for(let i of o.items){
                if(i.sku != ""){
                    let item
                    let product = await Products.findOne({ variantsArray: { $elemMatch: { sku: i.sku } } }).populate("design variantsArray.blank variantsArray.color").populate("blanks colors threadColors design")
                    if (!product) await Products.findOne({ variantsArray: { $elemMatch: { previousSkus: i.sku } } }).populate("design variantsArray.blank variantsArray.color")
                    if (product) {
                        // Do something with the product
                        console.log(product, "product found")
                        let variant = product.variantsArray.find(v => v.sku == i.sku)
                        if (!variant) variant = product.variantsArray.find(v => v.previousSkus && v.previousSkus.includes(i.sku))
                        //console.log(variant, "variant")
                        for (let j = 0; j < parseInt(i.quantity); j++) {
                            //console.log(variant.blank, variant.color, variant.size, product.design, variant.sku)
                            item = await createItem(i, order, variant.blank, variant.color, variant.threadColor, variant.size, product.design, variant.sku)
                            items.push(item)
                        }
                    }else{
                        let sku
                        if(i.upc){
                            sku = await SkuToUpc.findOne({$or: [{upc: i.upc}, {sku: i.sku}, {previousUpcs: {$elemMatch: {upc: i.upc}}}, {previousSkus: {$in: [i.sku]}}]})
                            if(sku && sku.sku != i.sku) sku = null
                        }
                        for(let j = 0; j < parseInt(i.quantity); j++){
                            let design
                            let blank
                            let color
                            let size
                            let threadColor
                            if(sku) {
                                design = await Design.findOne({_id: sku.design})
                                blank = await Blank.findOne({_id: sku.blank})
                                color = await Color.findOne({_id: sku.color})
                                threadColor = await Color.findOne({ _id: sku.threadColor })
                                size = blank?.sizes?.filter(s=> s.name.toLowerCase() == sku.size?.replace("Y", "").toLowerCase())[0]   
                            }else{
                                blank = await Blank.findOne({code: i.sku?.split("_")[0]})
                                color = await Color.findOne({name: i.sku?.split("_")[1]})
                                if(!color) await Color.findOne({$or: [{name: i.sku?.split("_")[2]}, {sku: i.sku?.split("_")[2]}]})
                                if(blank){
                                    size = blank.sizes?.filter(s=> s.name.toLowerCase() == i.sku.split("_")[2]?.replace("Y", "").toLowerCase())[0] 
                                    if(!size) size = blank.sizes?.filter(s=> s.name.toLowerCase() == i.sku.split("_")[1]?.replace("Y", "").toLowerCase())[0]
                                }
                                let dSku = i.sku?.split("_").splice(3)
                                let designSku =""
                                if(dSku){
                                    for(let j = 0; j < dSku.length; j++){
                                        if(j == 0) designSku = dSku[j]
                                        else designSku = `${designSku}_${dSku[j]}`
                                    }
                                    design = await Design.findOne({sku: designSku})
                                }
                            }
                            console.log(blank?.code, color?.name, size, design?.sku, sku ? sku.sku : i.sku, "item to save")
                            if(blank && blank.code.includes("PPSET")){
                                let sb = await Blanks.findOne({code: blank.code.split("_")[1]})
                                //console.log(item)
                                item = await createItem(i, order, sb, color, threadColor, size, design, sku ? sku.sku : i.sku)
                                items.push(item)
                                item = await createItem(i, order, blank, color, threadColor, size, design, sku ? sku.sku : i.sku)
                                items.push(item)
                            }else if(blank && blank.code == "LGDSET"){
                                let sb = await Blanks.findOne({code: "LGDSWT"})
                                //console.log(item)
                                item = await createItem(i, order, sb, color, threadColor, size, design, sku ? sku.sku : i.sku)
                                items.push(item)
                                item = await createItem(i, order, blank, color, threadColor, size, design, sku)
                                items.push(item)
                            }else if(blank && blank.code == "LGDSET"){
                                let sb = await Blanks.findOne({code: "GDT"})
                                item = await createItem(i, order, sb, color, threadColor, size, design, sku)
                                items.push(item)
                                item = await createItem(i, order, blank, color, threadColor, size, design, sku)
                                items.push(item)
                            }else{
                                item = await createItem(i, order, blank, color, threadColor, size, design, sku)
                                items.push(item)
                            }
                        }
                    }
                }
                //console.log(items)
            }
            order.items = items
        }else{
            order.status = o.orderStatus
            if(order.status == "shipped"){
                order.items.map(async i=>{
                    i.status = order.status;
                    i.labelPrinted = true;
                    i = await i.save()
                })
            }
            if(order.status == "cancelled" || order.status == "refunded"){
                order.items.map(async i=>{
                    i.status = order.status;
                    i.canceled = true;
                    await i.save()
                })
            }
        }
        //console.log(order)
        await order.save()
    }
}
setInterval(()=>{
    if(process.env.pm_id == 0 || process.env.pm_id == "0") pullOrders()
}, 1 * 60 *60 *1000)