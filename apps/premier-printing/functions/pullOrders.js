import { Design, Items as Item, Blank, Color, Order, Products, SkuToUpc, Inventory, ProductInventory } from "@pythias/mongo";
import { getOrders, generatePieceID } from "@pythias/integrations";
import Blanks from "@/models/Blanks";

let colorFixer = {
    LtGreen: "Light Green",
    BLUEJEAN: "Blue Jean",
    "BlueJean": "Blue Jean",
    ICEBLUE: "Ice Blue",
    IceBlue: "Ice Blue",
    "Army": "Army Green",
    "H. Grey": "Heather Grey",
    "H.Grey": "Heather Grey",
    HGrey: "Heather Grey",
    HGREY: "Heather Grey",
    HRed: "Heather Red",
    "H.Red": "Heather Red",
    "HRED": "Heather Red",
    HNavy: "Heather Navy",
    "H.Navy": "Heather Navy",
    "TrueNavy": "True Navy",
    TRUENAVY: "True Navy",
    HOTPINK: "Hot Pink",
    DkHeather: "Dark Heather",
    "H.Maroon": "Heather Maroon",
    HMaroon: "Heather Maroon",
    HMAROON: "Heather Maroon",
    "Lt.Pink": "Light Pink",
    LtPink: "Light Pink",
    "DUST": "Dust",
    "WHITE": "White",
    CAROLINA: "Carolina",
    GRAPHITE: "Graphite",
    LTGREEN: "Light Green",
    BERRY: "Berry",
    CHOCOLATE: "Chocolate",
    "PINK": "Pink",
    RASPBERRY: "Raspberry",
    "CREAM": "Ceam",
    "MINT": "Mint",
    "SEAFOAM": "Seafoam",
    GRASS: "Grass",
    VintageMustard: "Vintage Mustard",
    "Vintage/Black": "Vintage Black",
    BLACK: "Black",
    "CAMEL": "Camel",
    "PEPPER": "Pepper",
    "CARDINAL": "Cardinal",
    "FOREST": "Forest",
    "Royal": "Royal",
    NeonViolet: "Neon Violet",
    "NEONVIOLET": "Neon Violet",
    BlueSpruce: "Blue Spruce",
    "White/Seafoam": "White Seafoam",
    "White/Black": "White Black",
    "White/Red": "White Red",
    "White/Charcoal": "White Charcoal",
    "White/Coral": "White Coral",
    "White/Red/Royal": "White Red Royal",
    "White/Royal": "White Royal",
    "White/HotPink": "White Hot Pink",
    FloBlue: "Flo Blue",
    "WhiteSpot": "White Spot",
    Crunchberry: "Crunchberry",
    OCEAN: "Ocean",
    GREY: "Grey",
    GRAPE: "grape",
    WhiteNavy: "White Navy",
    "White/Navy": "White Navy",
    "HGreen": "Heather Green",
    "H.Green": "Heather Green",
    "BlueAqua": "Blue Aqua",

}
const sizeFixer = {
    "5/6": "5/6T",
    "5T": "5/6T",
    "15x16": "One Size",
    "YOUTH": "Youth",
}
const updateInventory = async ()=>{
    let inventories = await Inventory.find({})
    console.log(inventories.length, "inventories")
    for (let inv of inventories) {
        let items = await Item.find({ "inventory.inventory": inv._id, labelPrinted: false, canceled: false, shipped: false, paid: true })
        if (inv.quantity < 0) {
            inv.quantity = 0;
        }
        if (items.length > 0) {
            let itemIds = items.map(i => i._id.toString());
            inv.inStock = inv.inStock.filter(i => itemIds.includes(i.toString()));
            inv.attached = inv.attached.filter(i => itemIds.includes(i.toString()));
            if(inv.quantity > 0) {
                if(inv.quantity > inv.inStock.length + inv.attached.length) {
                    inv.attached = [];
                }
            }
            let newInStck = [];
            for(let id of inv.inStock) {
                if (!newInStck.includes(id) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(id)) {
                    newInStck.push(id);
                }
            }
            inv.inStock = newInStck;
            let newAttached = [];
            for(let id of inv.attached) {
                if(!newAttached.includes(id) && !inv.inStock.includes(id)) {
                    newAttached.push(id);
                }
            }
            inv.attached = newAttached;
            console.log(inv.style_code, inv.color_name, inv.size_name, inv.quantity, inv.attached.length, inv.inStock.length, items.length, inv.orders.map(o => o.items.length).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
            if (inv.quantity > 0) {
                for (let item of items) {
                    if (inv.quantity - inv.inStock.length > 0 && inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.inStock.push(item._id.toString())
                    } else if (inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.attached.push(item._id.toString())
                    }
                }
                await inv.save()
            } else {
                if (items.length > 0) {
                    for (let item of items) {
                        if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                            inv.attached.push(item._id.toString())
                        }
                    }
                    await inv.save()
                }
            }
        }
    }
}
const createItem = async (i, order, blank, color, threadColor, size, design, sku) => {
    console.log(size, "size")
    let item = new Item({ pieceId: await generatePieceID(), 
        paid: true, 
        sku: i.sku, 
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
    item = await item.save();
    let productInventory = await ProductInventory.findOne({ sku: item.sku })
    if (productInventory && productInventory.quantity - productInventory.onhold > 0) {
        if (productInventory.quantity > 0 - productInventory.onhold > 0) {
            item.inventory.inventoryType = "productInventory"
            item.inventory.productInventory = productInventory._id
            productInventory.inStock.push(item._id.toString())
            await productInventory.save()
        }
    } else {
        let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size })
        //console.log(inventory?.quantity, "inventory quantity for item",)
        if (inventory) {
            if (!item.inventory) item.inventory = {}
            item.inventory.inventoryType = "inventory"
            item.inventory.inventory = inventory._id
            console.log(inventory.attached, "inventory to save")
        }
    }
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
                    name: o.shipTo.name? o.shipTo.name: "not provided",
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
                    let product = await Products.findOne({ $or: [{ variantsArray: { $elemMatch: { sku: i.sku } } }, { variantsArray: { $elemMatch: { upc: i.upc } } }] }).populate("design variantsArray.blank variantsArray.color").populate("blanks colors threadColors design")
                    if (!product) await Products.findOne({ variantsArray: { $elemMatch: { previousSkus: i.sku } } }).populate("design variantsArray.blank variantsArray.color")
                    if (product) {
                        // Do something with the product
                        console.log(product, "product found")
                        let variant = product.variantsArray.find(v => v.sku == i.sku || v.upc == i.upc)
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
                                blank = await Blank.findOne({code: i.sku?.split("_")[0] == "TLS"? "RSTLS": i.sku?.split("_")[0]})
                                color = await Color.findOne({$or: [{name: i.sku?.split("_")[1]}, {sku: i.sku?.split("_")[1]}, {name: colorFixer[i.sku?.split("_")[1]]}]})
                                if(blank){
                                    size = blank.sizes?.filter(s=> s.name.toLowerCase() == i.sku.split("_")[2]?.replace("Y", "").toLowerCase() || sizeFixer[i.sku.split("_")[2]] == s.name)[0] 
                                    if (!size) size = blank.sizes?.filter(s => s.name.toLowerCase() == i.sku.split("_")[1]?.replace("Y", "").toLowerCase() || sizeFixer[i.sku.split("_")[1]] == s.name)[0]
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
                                item = await createItem(i, order, blank, color, threadColor, size, design, sku ? sku.sku : i.sku)
                                items.push(item)
                            }else if(blank && blank.code == "LGDSET"){
                                let sb = await Blanks.findOne({code: "GDT"})
                                item = await createItem(i, order, sb, color, threadColor, size, design, sku ? sku.sku : i.sku)
                                items.push(item)
                                item = await createItem(i, order, blank, color, threadColor, size, design, sku ? sku.sku : i.sku)
                                items.push(item)
                            }else{
                                item = await createItem(i, order, blank, color, threadColor, size, design, sku ? sku.sku : i.sku)
                                items.push(item)
                            }
                        }
                    }
                }
                //console.log(items)
            }
            order.items = items
            order = await order.save()
            items.map(async i => {
                i.order = order._id
                await i.save()
            })
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
            await order.save()
        }
    }
    await updateInventory();
}
setInterval(()=>{
    if(process.env.pm_id == 0 || process.env.pm_id == "0") pullOrders()
}, 1 * 60 *60 *1000)