import { Design, Items as Item, Blank, Color, Order, Products, SkuToUpc, Inventory, ProductInventory, Converters } from "@pythias/mongo";
import { getOrders, generatePieceID } from "@pythias/integrations";


const CreateSku = async ({ blank, color, size, design, threadColor, designSku }) => {
    let sku = `${blank.code}_${color.sku}_${size.name}${threadColor ? `_${threadColor}` : ""}${design ? `_${design.sku}` : ""}${!design && designSku ? `_${designSku}` : ""}`;
    return sku;
}
export const updateInventory = async ()=>{
    let inventories = await Inventory.find({})
    console.log(inventories.length, "inventories")
    for (let inv of inventories) {
        let items = await Item.find({ "inventory.inventory": inv._id, labelPrinted: false, canceled: false, shipped: false, paid: true })
        if (inv.quantity < 0 || !inv.quantity) {
            inv.quantity = 0;
        }
        inv.attached = []
        inv.inStock = []
        if (items.length > 0) {
            let itemIds = items.map(i => i._id.toString());
            inv.inStock = inv.inStock.filter(i => itemIds.includes(i.toString()));
            inv.attached = inv.attached.filter(i => itemIds.includes(i.toString()));
            if(inv.quantity > 0) {
                if(inv.quantity > inv.inStock.length + inv.attached.length) {
                    inv.attached = [];
                }
            }
            if(inv.quantity > inv.inStock.length){
                inv.attached = []
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
                    if (inv.quantity - inv.inStock.length > 0 && !inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.inStock.push(item._id.toString())
                    } else if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                        inv.attached.push(item._id.toString())
                    }
                }
            } else {
                if (items.length > 0) {
                    for (let item of items) {
                        if (!inv.attached.includes(item._id.toString()) && !inv.inStock.includes(item._id.toString()) && !inv.orders.map(o => o.items.map(i => i)).flat().includes(item._id.toString())) {
                            inv.attached.push(item._id.toString())
                        }
                    }
                }
            }
        }
        await inv.save()
    }
}
const createItemVariant = async (variant, product, order) => {
    let item = new Item({
        pieceId: await generatePieceID(),
        paid: true,
        sku: variant.sku,
        orderItemId: variant.orderItemId,
        blank: variant.blank,
        styleCode: variant.blank?.code,
        sizeName: variant.size && variant.size.name ? variant.size.name : variant.blank?.sizes.find(s => s._id.toString() == variant.size)?.name,
        threadColorName: variant.threadColor?.name,
        threadColor: variant.threadColor,
        colorName: variant.color?.name,
        color: variant.color,
        size: variant.size,
        design: variant.threadColor ? product.design.threadImages[variant.threadColor?.name] : product.design?.images,
        designRef: product.design,
        order: order._id,
        shippingType: order.shippingType,
        quantity: 1,
        status: order.status,
        name: variant.name,
        date: order.date,
        type: product.design?.printType,
        upc: variant.upc,
        isBlank: product.design ? false : true,
    })
    item = await item.save();
    let productInventory = await ProductInventory.findOne({ sku: item.sku })
    if (productInventory && productInventory.quantity - productInventory.inStock.length > 0) {
        if (productInventory.quantity > 0) {
            item.inventory.inventoryType = "productInventory"
            item.inventory.productInventory = productInventory._id
            productInventory.inStock.push(item._id.toString())
            await productInventory.save()
        }
    } else {
        let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size })
        if (!inventory) {
            inventory = await Inventory.findOne({ inventory_id: `${item.colorName}-${item.sizeName}-${item.styleCode}` })
        }
        if (inventory) {
            if (!item.inventory) item.inventory = {}
            item.inventory.inventoryType = "inventory"
            item.inventory.inventory = inventory._id
            console.log(inventory.attached, "inventory to save")
        }
    }
    return item
}
const createItem = async (i, order, blank, color, threadColor, size, design, sku, isBlank) => {
    console.log(isBlank, "isBlank+++++++++++++++")
    let item = new Item({ pieceId: await generatePieceID(), 
        paid: true, 
        sku: i.sku, 
        orderItemId: i.orderItemId, 
        blank: blank, 
        styleCode: blank?.code, 
        sizeName: size && size.name? size.name: blank?.sizes.find(s => s._id.toString() == size)?.name, 
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
        options: i.options[0]?.value,
        isBlank: isBlank == true? true: false
    })
    item = await item.save();
    let productInventory = await ProductInventory.findOne({ sku: item.sku })
    if (productInventory && productInventory.quantity - productInventory.inStock.length > 0) {
        if (productInventory.quantity > 0 ) {
            item.inventory.inventoryType = "productInventory"
            item.inventory.productInventory = productInventory._id
            productInventory.inStock.push(item._id.toString())
            await productInventory.save()
        }
    } else {
        let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size })
        if (!inventory) {
            inventory = await Inventory.findOne({ inventory_id: `${item.colorName}-${item.sizeName}-${item.styleCode}` })
        }
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
    let colorFixer
    let sizeFixer
    let blankConverter 
    let designFixer
    let designConverterDoc = await Converters.findOne({type: "design"});
    let blankConverterDoc = await Converters.findOne({type: "blank"});
    let colorConverterDoc = await Converters.findOne({type: "color"});
    let sizeConverterDoc = await Converters.findOne({type: "size"});
    if(blankConverterDoc && blankConverterDoc.converter) blankConverter = blankConverterDoc.converter;
    if(colorConverterDoc && colorConverterDoc.converter) colorFixer = colorConverterDoc.converter;
    if(sizeConverterDoc && sizeConverterDoc.converter) sizeFixer = sizeConverterDoc.converter;
    if(designConverterDoc && designConverterDoc.converter) designFixer = designConverterDoc.converter;
    console.log("pulling orders")
    let orders = await getOrders({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`})
    for(let o of orders){
        console.log(o.orderStatus, o.orderDate)
        let order = await Order.findOne({poNumber: o.orderNumber}).populate("items")
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
                    notesObj[sp[0].toLowerCase().replace(/ /g, "_").trim()] = sp[1]?.trim()
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
                for(let j = 0; j < parseInt(i.quantity); j++){
                    if (i.sku != "" && i.sku.includes("_") && (!i.sku.includes("PPSET") || i.sku.includes("PPSET_C"))) {
                        let item
                        let sku = i.sku;
                        let blankCode = sku.split("_")[0].trim();
                        let colorSku = sku.split("_")[1].trim();
                        let sizeName = sku.split("_")[2].trim();
                        let skuBroken = sku.split("_");
                        let designSku = skuBroken.slice(3, skuBroken.length).join("_");
                        console.log(blankCode, colorSku, sizeName, designSku, "broken sku")
                        let blank = await Blank.findOne({code: blankCode}).populate("colors")
                        if(!blank) blank = await Blank.findOne({code: blankConverter[blankCode]? blankConverter[blankCode]: blankCode}).populate("colors")
                        let color = blank?.colors.find(c => c.sku === colorSku.toLowerCase())
                        if(!color) color = blank?.colors.find(c => c.name.toLowerCase() === colorSku.toLowerCase())
                        if (!color) color = blank?.colors.find(c => c.name === colorSku)
                        if(!color) color = blank?.colors.find(c => c.name.toLowerCase() === colorFixer[colorSku]?.toLowerCase())
                        let size = blank?.sizes.find(s => s.name === sizeName || s.name === sizeFixer[sizeName])
                        let design = await Design.findOne({sku: designSku})
                        if(!design) design = await Design.findOne({sku: designFixer[designSku]? designFixer[designSku]: designSku}) 
                        console.log(blank?.code, color?.name, size?.name, design?.sku, "found items")
                        let product
                        let newSku
                        if(blank && color && size){
                            newSku = await CreateSku({blank, color, size, design, designSku})
                            product = await Products.findOne({ variantsArray: { $elemMatch: { sku: newSku } } }).populate("design", "sku images").populate("design variantsArray.blank variantsArray.color").populate("blanks colors threadColors design")
                            console.log(product, "found product")
                        }
                        if (product) {
                            let variant = product.variantsArray.find(v => v.sku === newSku)
                            if (variant) {
                                item = await createItemVariant(variant, product, order)
                                items.push(item)
                                let isBlank = product.design ? false : true
                                if (blank && blank.code.includes("PPSET")) {
                                    let sb = await Blank.findOne({ code: blank.code.split("_")[1] })
                                    //console.log(item)
                                    item = await createItem(i, order, sb, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                    items.push(item)
                                } else if (blank && blank.code == "LGDSET") {
                                    let sb = await Blank.findOne({ code: "LGDSWT" })
                                    //console.log(item)
                                    item = await createItem(i, order, sb, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                    items.push(item)
                                } else if (blank && blank.code == "LGDSET") {
                                    let sb = await Blank.findOne({ code: "GDT" })
                                    item = await createItem(i, order, sb, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                    items.push(item)
                                }
                            }
                        } else {
                            console.log("no product found")
                            console.log(blank?.code, color?.name, size?.name, design?.sku, "found items")
                            i.sku = newSku? newSku: i.sku
                            let isBlank = design || (designSku && !designSku !== "") ? false : true
                            if (blank && blank.code.includes("PPSET")) {
                                let sb = await Blank.findOne({code: blank.code.split("_")[1]})
                                //console.log(item)
                                item = await createItem(i, order, sb, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                items.push(item)
                                item = await createItem(i, order, blank, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                items.push(item)
                            }else if(blank && blank.code == "LGDSET"){
                                let sb = await Blank.findOne({code: "LGDSWT"})
                                //console.log(item)
                                item = await createItem(i, order, sb, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                items.push(item)
                                item = await createItem(i, order, blank, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                items.push(item)
                            }else if(blank && blank.code == "LGDSET"){
                                let sb = await Blank.findOne({code: "GDT"})
                                item = await createItem(i, order, sb, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                items.push(item)
                                item = await createItem(i, order, blank, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                items.push(item)
                            }else{
                                item = await createItem(i, order, blank, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                items.push(item)
                            }
                        }
                    } else if(i.sku.includes("PPSET")){
                        let item
                        console.log(i.sku, "pp set sku")
                        let pant = i.sku.split("_")[0] + `_${i.sku.split("_")[3]}`
                        let pantColor = i.sku.split("_")[1]
                        let pantSize = i.sku.split("_")[2]
                        let shirt = i.sku.split("_")[3]
                        let shirtColor = i.sku.split("_")[4]
                        let designSku = i.sku.split("_").slice(5, i.sku.split("_").length).join("_")
                        console.log(pant, pantColor, pantSize, shirt, shirtColor, designSku, "broken pp set sku")
                        let design = await Design.findOne({sku: designSku})
                        let blankPant = await Blank.findOne({ code: pant }).populate("colors")
                        let colorPant = blankPant.colors.find(c => c.sku === pantColor.toLowerCase())
                        if (!colorPant) colorPant = blankPant.colors.find(c => c.name.toLowerCase() === pantColor.toLowerCase())
                        if (!colorPant) colorPant = blankPant.colors.find(c => c.name.toLowerCase() === colorFixer[pantColor]?.toLowerCase())
                        let sizePant = blankPant.sizes.find(s => s.name === pantSize || s.name === sizeFixer[pantSize])
                        let blankShirt = await Blank.findOne({ code: shirt }).populate("colors")
                        let colorShirt = blankShirt.colors.find(c => c.sku === shirtColor.toLowerCase())
                        if (!colorShirt) colorShirt = blankShirt.colors.find(c => c.name.toLowerCase() === shirtColor.toLowerCase())
                        if (!colorShirt) colorShirt = blankShirt.colors.find(c => c.name.toLowerCase() === colorFixer[shirtColor]?.toLowerCase())
                        let sizeShirt = blankShirt.sizes.find(s => s.name === pantSize || s.name === sizeFixer[pantSize])
                        console.log(blankPant.code, colorPant?.name, sizePant?.name, "pant info")
                        console.log(blankShirt.code, colorShirt?.name, sizeShirt?.name, "shirt info")
                        item = await createItem(i, order, blankPant, colorPant, null, sizePant, null, i.sku, true)
                        items.push(item)
                        item = await createItem(i, order, blankShirt, colorShirt, null, sizePant, design, i.sku, (design || (designSku && !designSku === "") ? false : true))
                        items.push(item)
                    } else if(i.sku !== ""){
                        let item
                        console.log("no sku on item")
                        console.log(i, "item without sku")
                        if (i.upc || i.sku) {
                            console.log("has upc or sku")
                            let product = await Products.findOne({ $or: [{ variantsArray: { $elemMatch: { upc: i.upc } } }, { variantsArray: { $elemMatch: { upc: i.sku } } }] }).populate("design", "sku images").populate("design variantsArray.blank variantsArray.color").populate("blanks colors threadColors design")
                            console.log(product, "found product by upc or sku")
                            if (product) {
                                let variant = product.variantsArray.find(v => v.upc === i.upc || v.upc === i.sku || v.sku === i.sku || v.sku === i.upc)
                                if (variant) {
                                    item = await createItemVariant(variant, product, order)
                                    items.push(item)
                                    let isBlank = product.design ? false : true
                                    if (variant.blank && variant.blank.code.includes("PPSET")) {
                                        let sb = await Blank.findOne({ code: variant.blank.code.split("_")[1] })
                                        //console.log(item)
                                        item = await createItem(i, order, sb, variant.color, variant.threadColor, variant.size, product.design, variant.sku ? variant.sku : i.sku, isBlank)
                                        items.push(item)
                                    } else if (variant.blank && variant.blank.code == "LGDSET") {
                                        let sb = await Blank.findOne({ code: "LGDSWT" })
                                        //console.log(item)
                                        item = await createItem(i, order, sb, variant.color, variant.threadColor, variant.size, product.design, variant.sku ? variant.sku : i.sku, isBlank)
                                        items.push(item)
                                    } else if (variant.blank && variant.blank.code == "LGDSET") {
                                        let sb = await Blank.findOne({ code: "GDT" })
                                        item = await createItem(i, order, sb, variant.color, variant.threadColor, variant.size, product.design, variant.sku ? variant.sku : i.sku, isBlank)
                                        items.push(item)
                                    }
                                }else{
                                    console.log("no product found by upc or sku")
                                    item = await createItem(i, order, null, null, null, null, null, i.sku, true)
                                    items.push(item)
                                }
                            }else{

                                console.log("no product found by upc or sku")
                                item = await createItem(i, order, null, null, null, null, null, i.sku, true)
                                items.push(item)
                            }
                        }else{
                            console.log("no product found by upc or sku")
                            item = await createItem(i, order, null, null, null, null, null, i.sku, true)
                            items.push(item)
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
            if(order.shippingAddress.name != o.shipTo.name || order.shippingAddress.address1 != o.shipTo.street1 || order.shippingAddress.address2 != o.shipTo.street2 || order.shippingAddress.city != o.shipTo.city || order.shippingAddress.zip != o.shipTo.postalCode || order.shippingAddress.state != o.shipTo.state || order.shippingAddress.country != o.shipTo.country){
                order.shippingAddress.name = o.shipTo.name? o.shipTo.name: "not provided"
                order.shippingAddress.address1 = o.shipTo.street1 ? o.shipTo.street1 : "not provided"
                order.shippingAddress.address2 = o.shipTo.street2 ? o.shipTo.street2 : "not provided"
                order.shippingAddress.city = o.shipTo.city ? o.shipTo.city : "not provided"
                order.shippingAddress.zip = o.shipTo.postalCode ? o.shipTo.postalCode : "not provided"
                order.shippingAddress.state = o.shipTo.state ? o.shipTo.state : "not provided"
                order.shippingAddress.country = o.shipTo.country ? o.shipTo.country : "not provided"
            }
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