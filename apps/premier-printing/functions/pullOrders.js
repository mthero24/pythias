import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Item from "@/models/Items";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import Order from "@/models/Order";
import { getOrders, generatePieceID } from "@pythias/integrations";
import Blanks from "@/models/Blanks";
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
                        if(sku) {
                            design = await Design.findOne({_id: sku.design})
                            blank = await Blank.findOne({_id: sku.blank})
                            color = await Color.findOne({_id: sku.color})
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
                        if(blank && blank.code.includes("PPSET")){
                            let sb = await Blanks.findOne({code: blank.code.split("_")[1]})
                            let shirtItem = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, upc: i.upc, orderItemId: i.orderItemId, blank: sb, styleCode: sb?.code, sizeName: size?.name, colorName: color?.name, color, size, design: design?.images, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date}) 
                            let item = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, upc: i.upc, orderItemId: i.orderItemId, blank, styleCode: blank?.code, sizeName: size?.name, colorName: color?.name, color, size, design: design?.images, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date})
                            //console.log(item)
                            await item.save()
                            await shirtItem.save()
                            items.push(item)
                            items.push(shirtItem)
                        }else if(blank && blank.code == "LGDSET"){
                            let sb = await Blanks.findOne({code: "LGDSWT"})
                            let shirtItem = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, upc: i.upc, orderItemId: i.orderItemId, blank: sb, styleCode: sb?.code, sizeName: size?.name, colorName: color?.name, color, size, design: design?.images, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date}) 
                            let item = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, upc: i.upc, orderItemId: i.orderItemId, blank, styleCode: blank?.code, sizeName: size?.name, colorName: color?.name, color, size, design: design?.images, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date})
                            //console.log(item)
                            await item.save()
                            await shirtItem.save()
                            items.push(item)
                            items.push(shirtItem)
                        }else if(blank && blank.code == "LGDSET"){
                            let sb = await Blanks.findOne({code: "GDT"})
                            let shirtItem = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, upc: i.upc, orderItemId: i.orderItemId, blank: sb, styleCode: sb?.code, sizeName: size?.name, colorName: color?.name, color, size, design: design?.images, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date}) 
                            let item = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, upc: i.upc, orderItemId: i.orderItemId, blank, styleCode: blank?.code, sizeName: size?.name, colorName: color?.name, color, size, design: design?.images, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date})
                            //console.log(item)
                            await item.save()
                            await shirtItem.save()
                            items.push(item)
                            items.push(shirtItem)
                        }else{
                            let item = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, upc: i.upc, orderItemId: i.orderItemId, blank, styleCode: blank?.code, sizeName: size?.name, colorName: color?.name, color, size, design: design?.images, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date})
                            //console.log(item)
                            await item.save()
                            items.push(item)
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