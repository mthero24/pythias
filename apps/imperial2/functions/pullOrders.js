import { Design, Items as Item, Blank, Color, Order, Products, Inventory, ProductInventory} from "@pythias/mongo";
import { getOrders, generatePieceID } from "@pythias/integrations";
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
    "X-Large": "XL",
    "XL": "X-Large",
    "M": "Medium",
    "S": "Small",
    "L": "Large",
    "X-Small": "XS",
    "Youth Medium": "M",
    "Youth Small": "S",
    "Youth Large": "L",
    "Youth XLarge": "XL",

}
const createItem = async ({i, order, design, blank, size, color, threadColor, sku} ) => {
    let item = new Item({
        pieceId: await generatePieceID(),
        paid: true,
        sku: i.sku,
        orderItemId: i.orderItemId,
        blank: blank,
        styleCode:blank.code,
        sizeName: size?.name,
        threadColorName: threadColor?.name,
        threadColor: threadColor,
        colorName: color?.name,
        color: color,
        size: size,
        design: threadColor ? design.threadImages[threadColor?.name] : design.images,
        designRef: design,
        order: order._id,
        shippingType: order.shippingType,
        quantity: 1,
        status: order.status,
        name: i.name,
        date: order.date,
        type: design.printType,
        options: i.options[0]?.value
    })
    if (order.status == "cancelled") {
        item.canceled = true
    }
    let productInventory = await ProductInventory.findOne({ sku: i.sku })
    if (productInventory && productInventory.quantity > productInventory.quantity - productInventory.onhold) {
        if (productInventory.quantity > productInventory.quantity - productInventory.onhold) {
            item.inventory.inventoryType = "productInventory"
            item.inventory.productInventory = productInventory._id
            productInventory.onhold += 1
            await productInventory.save()
        }

    } else {
        let inventory = await Inventory.findOne({ blank: blank._id, color: color ? color._id : null, sizeId: size?._id? size._id.toString() : size?.toString() })
        if (inventory) {
            if (inventory.quantity > inventory.quantity - inventory.onhold) {
                inventory.onhold += 1
                await inventory.save()
                if (!item.inventory) item.inventory = {}
                item.inventory.inventoryType = "inventory"
                item.inventory.inventory = inventory._id
            } else {
                if (!inventory.attached) inventory.attached = []
                if (!inventory.attached.includes(item._id.toString())) inventory.attached.push(item._id)
                inventory.onhold += 1
                if (!item.inventory) item.inventory = {}
                item.inventory.inventoryType = "inventory"
                item.inventory.inventory = inventory._id
                await inventory.save()
            }
        }
    }
    await item.save();
    return item;
}
export async function pullOrders(id){
    let blanks = await Blank.find({})
    let colors = await Color.find({})
    let fixers = blanks.map(b=>{return b.fixerCode})
    fixers.sort((a,b)=>{
        if(a.length > b.length) return -1
        if(a.length < b.length) return 1
        return 0
    })
    console.log("pull orders")
    let orders = await getOrders({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, id: id})
    for(let o of orders){
        console.log(o.orderStatus, o.orderDate)
        if (o.customerNotes?.includes("tiktok_fulfillment_type: 3PL")) continue;
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
            let items = []
            for(let i of o.items){
                if(i.sku && i.sku != ""){
                    //console.log(i.sku, i.sku.split("_")[2]?.trim())
                    let product = await Products.findOne({ variantsArray: { $elemMatch: { sku: i.sku } } }).populate("design variantsArray.blank variantsArray.color variantsArray.threadColor").populate("blanks colors threadColors design")
                    if (!product) await Products.findOne({ variantsArray: { $elemMatch: { previousSkus: i.sku } } }).populate("design variantsArray.blank variantsArray.color variantsArray.threadColor").populate("blanks colors threadColors design")
                    let item
                    if(product) {
                        // Do something with the product
                        //console.log(product.sku, "product found")
                        let variant = product.variantsArray.find(v => v.sku == i.sku)[0]
                        if(!variant) variant = product.variantsArray.find(v => v.previousSkus && v.previousSkus.includes(i.sku))
                        if(!variant){
                            let sku = i.sku.split("_")
                            let blank
                            let threadColor
                            let designSku = sku[1]
                            let colorName = sku[2]
                            let sizeName = sku[3]
                            if (sku.length == 5) {
                                blank = sku[sku.length - 1]
                            } else {
                                blank = sku[sku.length - 2]
                                threadColor = sku[sku.length - 1]
                            }
                            blank = await Blank.findOne({ code: blank }).populate("colors")
                            let design = await Design.findOne({ sku: designSku })
                            let blankColor = blank?.colors.filter(c => c.name.toLowerCase() == colorName.toLowerCase() || c.sku.toLowerCase() == colorName.toLowerCase())[0]
                            let blankSize = blank?.sizes.filter(c => c.name.toLowerCase() == sizeName.toLowerCase() || c.name.toLowerCase() ==sizeFixer[sizeName]?.toLowerCase())[0]
                            let DesignThreadColor = colors.filter(c => c.name.toLowerCase() == threadColor?.toLowerCase() || c.sku.toLowerCase() == threadColor?.toLowerCase())[0]
                            let designImages
                            if (DesignThreadColor) {
                                //console.log((design != undefined && design.threadImages != undefined && design.threadImages[DesignThreadColor.name] != undefined), "design images")
                                if (design != undefined && design.threadImages != undefined && design.threadImages[DesignThreadColor.name] != undefined) designImages = design.threadImages[DesignThreadColor.name]
                                else if (design != undefined && design.threadImages != undefined && design.threadImages[threadColor] != undefined) designImages = design.threadImages[threadColor]
                                else if (design) designImages = design.images
                            } else if (design) {
                                designImages = design.images
                            }
                            console.log("no variant")
                            item = await createItem({i, order, design, blank, size: blankSize, color: blankColor, threadColor: DesignThreadColor, sku:i.sku})
                            items.push(item)
                        }else{
                            console.log("variant found")
                            console.log(variant.sku, "variant sku")
                            let sku = variant.sku.split("_")
                            let sizeName = sku[3]
                            console.log(sizeName, sizeFixer[sizeName], "sizeFixer")
                            console.log(variant, "variant")
                            console.log(variant.size, "variant.size")
                            console.log(variant.blank.sizes.filter(s=> s._id.toString() == variant.size.toString()), "variant blank sizes")
                            item = await createItem({ i, order, design: product.design, blank: variant.blank, size: variant.blank.sizes.filter(s => s._id.toString() == variant.size.toString())[0], color: variant.color, threadColor: variant.threadColor, sku: variant.sku})
                            console.log("variant found")
                            items.push(item)
                        }
                    }else{
                        console.log(i.sku, "sku new")
                        let sku = i.sku.split("_")
                        let blank
                        let threadColor
                        let designSku = sku[1]
                        let colorName = sku[2]
                        let sizeName = sku[3]
                        console.log(sizeName, sizeFixer[sizeName])
                        if (sku.length == 5) {
                            blank = sku[sku.length - 1]
                        } else {
                            blank = sku[sku.length - 2]
                            threadColor = sku[sku.length - 1]
                        }
                        blank = await Blank.findOne({ code: blank }).populate("colors")
                        let design = await Design.findOne({ sku: designSku })
                        let blankColor = blank?.colors.filter(c => c.name.toLowerCase() == colorName.toLowerCase() || c.sku.toLowerCase() == colorName.toLowerCase())[0]
                        let blankSize = blank?.sizes.filter(c => c.name.toLowerCase() == sizeName.toLowerCase() || c.name.toLowerCase() == sizeFixer[sizeName]?.toLowerCase())[0]
                        let DesignThreadColor = colors.filter(c => c.name.toLowerCase() == threadColor?.toLowerCase() || c.sku.toLowerCase() == threadColor?.toLowerCase())[0]
                        let designImages
                        if (DesignThreadColor) {
                            //console.log((design != undefined && design.threadImages != undefined && design.threadImages[DesignThreadColor.name] != undefined), "design images")
                            if (design != undefined && design.threadImages != undefined && design.threadImages[DesignThreadColor.name] != undefined) designImages = design.threadImages[DesignThreadColor.name]
                            else if (design != undefined && design.threadImages != undefined && design.threadImages[threadColor] != undefined) designImages = design.threadImages[threadColor]
                            else if (design) designImages = design.images
                        } else if (design) {
                            designImages = design.images
                        }
                        if(design && blank && blankSize && blankColor){
                            console.log("good sku")
                            item = await createItem({ i, order, design, blank, size: blankSize, color: blankColor, threadColor: DesignThreadColor, sku: i.sku })
                            items.push(item)
                        }else{
                            if(i.sku.split("_").length <= 3 || i.sku.toLowerCase().split("_")[0] == "front" || i.sku.toLowerCase().split("_").includes("leftchest") || i.sku.toLowerCase().split("_").includes("front") || i.sku.toLowerCase().split("_").includes("back")){
                                let design = await Design.findOne({ name: i.sku.split("_")[2]?.replace(/’/g, "'").trim() })
                                //console.log(design?.name)
                                //console.log(i.options[0].value.split(", "))
                                let options = i.options[0]?.value.split(", ")
                                let style = options ? fixers.filter(f => options[0]?.includes(f))[0] : undefined
                                let color = options ? options[0]?.split(style)[0]?.replace(/Youth/g, "").trim() : undefined
                                let size = options ? options[1] : undefined
                                let threadColor = options ? options[2] : undefined
                                console.log(style, color, size, threadColor)
                                let blank = await Blank.findOne({ fixerCode: style?.trim() }).populate("colors")
                                let blankColor = blank?.colors.filter(c => c.name == color)[0]
                                if (!blankColor) {
                                    for (let co of (colorFixer[color] ? colorFixer[color].split(", ") : [])) {
                                        let b = blank?.colors.filter(c => c.name == co)[0]
                                        if (b) blankColor = b
                                    }
                                }
                                let blankSize = blank?.sizes.filter(s => s.name == size)[0]
                                if (!blankSize) blankSize = blank?.sizes.filter(s => s.name == sizeFixer[size])[0]
                                let DesignThreadColor = colors?.filter(c => c.name == threadColor)[0]
                                let designImages
                                if (DesignThreadColor) {
                                    if (design != undefined && design.threadImages != undefined && design.threadImages[DesignThreadColor.name] != undefined) designImages = design.threadImages[DesignThreadColor.name]
                                    else if (design != undefined && design.threadImages != undefined && design.threadImages[threadColor] != undefined) designImages = design.threadImages[threadColor]
                                    else if (design) designImages = design.images
                                } else if (design) {
                                    designImages = design.images
                                }
                                if (design, blank, blankSize, blankColor, DesignThreadColor) {
                                    console.log(design, blank, blankSize, blankColor, DesignThreadColor)
                                    item = await createItem({ i, order, design, blank, size: blankSize, color: blankColor, threadColor: DesignThreadColor, sku: i.sku })
                                    items.push(item)
                                }else{
                                    console.log("old sku no match")
                                    let item = new Item({ pieceId: await generatePieceID(), paid: true, sku: i.sku, orderItemId: i.orderItemId, blank, styleCode: blank?.code, sizeName: blankSize ? blankSize.name : size, threadColorName: DesignThreadColor ? DesignThreadColor.name : threadColor, threadColor: DesignThreadColor, colorName: blankColor?.name, color: blankColor, size: blankSize, design: designImages, designRef: design, order: order._id, shippingType: order.shippingType, quantity: 1, status: order.status, name: i.name, date: order.date, type: i.sku.split("_")[0], options: i.options[0]?.value })
                                    if (o.tagIds != null || o.orderStatus == "shipped") {
                                        item.labelPrinted = true
                                    }
                                    if (order.status == "cancelled") {
                                        item.canceled = true
                                    }
                                    //console.log(item)
                                    await item.save()
                                    items.push(item)
                                }
                            }
                        }
                    }
                }else{
                    console.log(i.sku, i, "no sku")
                    if(i.name.toLowerCase() != "seller discount" && i.name.toLowerCase() != "platform discount"){ 
                        let item = new Item({
                            pieceId: await generatePieceID(),
                            paid: true,
                            orderItemId: i.orderItemId,
                            order: order._id,
                            shippingType: order.shippingType,
                            quantity: 1,
                            status: order.status,
                            name: i.name,
                            date: order.date,
                            type: "unknown",
                            options: i.options[0]?.value
                        })
                        if (order.status == "cancelled") {
                            item.canceled = true
                        }
                        await item.save()
                        items.push(item)
                    }
                }
            }
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
        await order.save()
    }
}
setInterval(()=>{
    if(process.env.pm_id == 9 ) pullOrders()
}, 1 * 60 *60 *1000)