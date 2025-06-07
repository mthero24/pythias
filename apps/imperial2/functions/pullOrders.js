import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Item from "@/models/Items";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import Order from "@/models/Order";
import { getOrders, generatePieceID } from "@pythias/integrations";
export async function pullOrders(){
    let blanks = await Blank.find({})
    let colors = await Color.find({})
    let fixers = blanks.map(b=>{return b.fixerCode})
    fixers.sort((a,b)=>{
        if(a.length > b.length) return -1
        if(a.length < b.length) return 1
        return 0
    })
    //console.log(fixers)
    console.log("pull orders")
    let orders = await getOrders({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`})
    console.log(orders.filter(o=> o.tagIds == null && o.orderStatus != "shipped").length, orders.filter(o=> o.tagIds != null).map(o=>{return o.tagIds}) )
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
            let colorFixer = {
                "White/Black": "Blk/Wht",
                Sand: "Khaki",
                "Red/Sand": "Red/Natl",
                "Blue/Sand": "Ryl/Natl",
                "Ash Grey": "Ash",
                "Pink": "Light Pink, blossom, Blossom",
                "Green/Sand": "Dk.Grn/Kha",
                Blue: "Lt.Blue"
            }
            let sizeFixer = {
                "One Size Fits All": "OSFA",
                "XSmall": "XS",
                "Large": "L",
                "Small": "S",
                "Medium": "M",
                "XLarge": "XL",
                "Youth Medium": "M",
                "Youth Small": "S",
                "Youth Large": "L",
                "Youth XLarge": "XL",

            }
            for(let i of o.items){
                if(i.sku && i.sku != ""){
                    //console.log(i.sku, i.sku.split("_")[2]?.trim())
                   let design = await Design.findOne({name: i.sku.split("_")[2]?.replace(/’/g, "'").trim()})
                   //console.log(design?.name)
                   //console.log(i.options[0].value.split(", "))
                   let options = i.options[0].value.split(", ")
                   let style = fixers.filter(f=> options[0].includes(f))[0]
                   let color = options[0].split(style)[0]?.replace(/Youth/g, "").trim()
                   let size = options[1]
                   let threadColor = options[2] 
                   console.log(style, color, size, threadColor)
                   let blank = await Blank.findOne({fixerCode: style.trim()}).populate("colors")
                   let blankColor = blank.colors.filter(c=> c.name == color)[0]
                   if(!blankColor){
                        for(let co of (colorFixer[color]? colorFixer[color].split(", "): [])){
                            let b = blank.colors.filter(c=> c.name == co)[0]
                            if(b)blankColor = b
                        }
                   }
                   let blankSize = blank.sizes.filter(s=> s.name == size)[0]
                   if(!blankSize) blankSize = blank.sizes.filter(s=> s.name == sizeFixer[size])[0]
                   console.log(blank.code, blankColor, blankSize)
                   console.log( blankColor?.name, blankSize?.name)
                    let DesignThreadColor = colors.filter(c=> c.name == threadColor)[0]
                    let designImages
                    if(DesignThreadColor){
                        if(design && design.threadImages && design.threadImages[DesignThreadColor.name]) designImages = design.threadImages[DesignThreadColor.name]
                    }else if(design){
                        designImages = design.images
                    }
                    let item = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, orderItemId: i.orderItemId, blank, styleCode: blank?.code, sizeName: blankSize? blankSize.name: size, threadColorName: DesignThreadColor? DesignThreadColor.name: threadColor, threadColor: DesignThreadColor, colorName: blankColor?.name, color: blankColor , size: blankSize, design: designImages, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date, type: i.sku.split("_")[0], options: i.options[0].value})
                    if(o.tagIds != null || o.orderStatus == "shipped"){
                        item.labelPrinted = true
                    }
                    if(order.status == "cancelled"){
                        item.canceled = true
                    }
                    //console.log(item)
                    await item.save()
                    items.push(item)
                }
                //console.log(items)
            }
            order.items = items
        }else{
            order.status = o.orderStatus
            if(o.tagIds != null) order.status = "Links"
            if(order.status == "shipped" || order.status == "Links"){
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
    if(process.env.pm_id != undefined) pullOrders()
}, 1 * 60 *60 *1000)