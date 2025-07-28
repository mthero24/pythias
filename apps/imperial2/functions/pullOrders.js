import { Design, Items as Item, Blank, Color, Order} from "@pythias/mongo";
import { getOrders, generatePieceID } from "@pythias/integrations";
export async function pullOrders(id){
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
    let orders = await getOrders({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, id: id})
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
            order = await order.save()
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
                "One Size Fits Most": "OSFM",
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
                    console.log(i.sku, "sku new")
                    let sku = i.sku.split("_")
                    let blank 
                    let threadColor
                    let printType = sku[0]
                    let designSku = sku[1]
                    let colorName = sku[2]
                    let sizeName = sku[3]
                    if(sku.length == 5){
                        blank = sku[sku.length - 1]
                    }else{
                        blank = sku[sku.length - 2]
                        threadColor = sku[sku.length - 1]
                    }
                    blank = await Blank.findOne({code: blank}).populate("colors")
                    let design = await Design.findOne({sku: designSku})
                    let blankColor = blank?.colors.filter(c=> c.name.toLowerCase() == colorName.toLowerCase() || c.sku.toLowerCase() == colorName.toLowerCase())[0]
                    let blankSize = blank?.sizes.filter(c=> c.name.toLowerCase() == sizeName.toLowerCase())[0]
                    let DesignThreadColor = colors.filter(c=> c.name.toLowerCase() == threadColor?.toLowerCase() || c.sku.toLowerCase() == threadColor?.toLowerCase())[0]
                    let designImages
                    if(DesignThreadColor){
                        console.log((design != undefined && design.threadImages != undefined && design.threadImages[DesignThreadColor.name] != undefined), "design images")
                        if (design != undefined && design.threadImages != undefined && design.threadImages[DesignThreadColor.name] != undefined) designImages = design.threadImages[DesignThreadColor.name]
                        else if (design != undefined && design.threadImages != undefined && design.threadImages[threadColor] != undefined) designImages = design.threadImages[threadColor]
                        else if(design) designImages = design.images
                    }else if(design){
                        designImages = design.images
                    }
                    let item = new Item({pieceId: await generatePieceID(), paid: true, sku: i.sku, orderItemId: i.orderItemId, blank, styleCode: blank?.code, sizeName: blankSize? blankSize.name: size, threadColorName: DesignThreadColor? DesignThreadColor.name: threadColor, threadColor: DesignThreadColor, colorName: blankColor?.name, color: blankColor , size: blankSize, design: designImages, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date, type: i.sku.split("_")[0], options: i.options[0].value, poNumber: order.poNumber})
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
            }
                //console.log(items)
            order.items = items
        }else{
            order.status = o.orderStatus
            if(o.tagIds != null) order.status = "Links"
            if((order.status == "shipped" && order.preshipped == false) || order.status == "Links"){
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
    if(process.env.pm_id == 9 ) pullOrders()
}, 1 * 60 *60 *1000)