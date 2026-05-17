import { Design, Items as Item, Blank, Color, Order, Products, SkuToUpc, Inventory, ProductInventory, Converters, ApiKeyIntegrations } from "@pythias/mongo";
import { getOrders, generatePieceID, getOrdersFaire, getReleasedOrdersWalmart, getOpenReceiptsEtsy, getShipAdviceAcenda } from "@pythias/integrations";


const CreateSku = async ({ blank, color, size, design, threadColor, designSku }) => {
    let sku = `${blank.code}_${color.sku}_${size.sku}${threadColor ? `_${threadColor}` : ""}${design ? `_${design.sku}` : ""}${!design && designSku ? `_${designSku}` : ""}`;
    return sku;
}
export const updateInventory = async () => {
    // One query for all relevant items instead of one per inventory record
    const activeItems = await Item.find({
        "inventory.inventory": { $exists: true, $ne: null },
        labelPrinted: false, canceled: false, shipped: false, paid: true,
    }).select("_id inventory.inventory").lean();

    // Group item IDs by inventory ID
    const itemsByInvId = {};
    for (const item of activeItems) {
        const invId = String(item.inventory?.inventory);
        if (!itemsByInvId[invId]) itemsByInvId[invId] = [];
        itemsByInvId[invId].push(String(item._id));
    }

    // Load all inventory as plain objects — avoid Mongoose Document overhead
    const inventories = await Inventory.find({}).lean();

    const ops = [];
    for (const inv of inventories) {
        const invId = String(inv._id);
        const itemIds = itemsByInvId[invId] || [];
        const quantity = (inv.quantity < 0 || !inv.quantity) ? 0 : inv.quantity;

        // Build a Set of item IDs already committed to orders — O(1) lookup instead of repeated .flat().includes()
        const orderedIds = new Set((inv.orders || []).flatMap(o => (o.items || []).map(i => String(i))));

        const inStock = [];
        const attached = [];

        for (const itemId of itemIds) {
            if (orderedIds.has(itemId)) continue;
            if (quantity > 0 && quantity - inStock.length > 0) {
                inStock.push(itemId);
            } else {
                attached.push(itemId);
            }
        }

        ops.push({
            updateOne: {
                filter: { _id: inv._id },
                update: { $set: { quantity, attached, inStock } },
            },
        });
    }

    if (ops.length > 0) await Inventory.bulkWrite(ops, { ordered: false });
}
const createItemVariant = async (variant, product, order, price) => {
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
        price: price
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
        isBlank: isBlank == true? true: false,
        price: i.unitPrice
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

// ─── Marketplace order normalizers ────────────────────────────────────────────
// Normalize Faire orders to the same shape the processing loop expects.
function normalizeFaireOrder(o, conn) {
    const stateMap = { NEW: "awaiting_shipment", PROCESSING: "awaiting_shipment", SHIPPED: "shipped", CANCELED: "cancelled", BACKORDERED: "on_hold" };
    return {
        orderNumber: o.display_id ?? o.id,
        orderId: o.id,
        orderKey: o.id,
        orderDate: o.created_at ? new Date(o.created_at) : new Date(),
        orderStatus: stateMap[o.state] ?? "awaiting_shipment",
        advancedOptions: { source: "faire" },
        billTo: { name: "faire" },
        shipTo: {
            name: o.ship_to?.name ?? "not provided",
            street1: o.ship_to?.address1 ?? "not provided",
            street2: o.ship_to?.address2 ?? "",
            city: o.ship_to?.city ?? "not provided",
            postalCode: o.ship_to?.postal_code ?? "not provided",
            state: o.ship_to?.state ?? "",
            country: o.ship_to?.country_code ?? "US",
        },
        orderTotal: (o.items ?? []).reduce((s, i) => s + ((i.price?.amount_minor ?? 0) / 100), 0),
        customerNotes: "",
        items: (o.items ?? []).map(i => ({
            sku: i.sku ?? "",
            quantity: i.quantity ?? 1,
            orderItemId: i.id,
            unitPrice: (i.price?.amount_minor ?? 0) / 100,
            name: i.display_title ?? i.sku ?? "",
            upc: "",
            options: [],
        })),
        _marketplaceOrderId: o.id,
        _marketplaceConnectionId: conn._id,
    };
}

function normalizeWalmartOrder(o, conn) {
    const lines = (o.orderLines?.orderLine ?? []).flatMap(line => {
        const qty = parseInt(line.orderLineQuantity?.amount ?? "1", 10);
        return Array.from({ length: qty }, () => ({
            sku: line.item?.sku ?? "",
            quantity: 1,
            orderItemId: `${o.purchaseOrderId}_${line.lineNumber}`,
            unitPrice: line.charges?.charge?.[0]?.chargeAmount?.amount ?? 0,
            name: line.item?.productName ?? "",
            upc: "",
            options: [],
        }));
    });
    return {
        orderNumber: o.customerOrderId ?? o.purchaseOrderId,
        orderId: o.purchaseOrderId,
        orderKey: o.purchaseOrderId,
        orderDate: o.orderDate ? new Date(o.orderDate) : new Date(),
        orderStatus: "awaiting_shipment",
        advancedOptions: { source: "walmart" },
        billTo: { name: "walmart" },
        shipTo: {
            name: o.shippingInfo?.postalAddress?.name ?? "not provided",
            street1: o.shippingInfo?.postalAddress?.address1 ?? "not provided",
            street2: o.shippingInfo?.postalAddress?.address2 ?? "",
            city: o.shippingInfo?.postalAddress?.city ?? "not provided",
            postalCode: o.shippingInfo?.postalAddress?.postalCode ?? "not provided",
            state: o.shippingInfo?.postalAddress?.state ?? "",
            country: o.shippingInfo?.postalAddress?.country ?? "US",
        },
        orderTotal: lines.reduce((s, l) => s + l.unitPrice, 0),
        customerNotes: "",
        items: lines,
        _marketplaceOrderId: o.purchaseOrderId,
        _marketplaceConnectionId: conn._id,
    };
}

function normalizeEtsyOrder(o, conn) {
    return {
        orderNumber: String(o.receipt_id),
        orderId: String(o.receipt_id),
        orderKey: String(o.receipt_id),
        orderDate: o.create_timestamp ? new Date(o.create_timestamp * 1000) : new Date(),
        orderStatus: "awaiting_shipment",
        advancedOptions: { source: "etsy" },
        billTo: { name: "etsy" },
        shipTo: {
            name: o.name ?? "not provided",
            street1: o.first_line ?? o.second_line ?? "not provided",
            street2: "",
            city: o.city ?? "not provided",
            postalCode: o.zip ?? "not provided",
            state: o.state ?? "",
            country: o.country_iso ?? "US",
        },
        orderTotal: o.grandtotal?.amount ? o.grandtotal.amount / (o.grandtotal.divisor ?? 100) : 0,
        customerNotes: "",
        items: (o.transactions ?? []).map(t => ({
            sku: t.sku ?? t.product_data?.sku ?? "",
            quantity: t.quantity ?? 1,
            orderItemId: String(t.transaction_id),
            unitPrice: t.price?.amount ? t.price.amount / (t.price.divisor ?? 100) : 0,
            name: t.title ?? "",
            upc: "",
            options: (t.variations ?? []).map(v => ({ value: v.formatted_value })),
        })),
        _marketplaceOrderId: String(o.receipt_id),
        _marketplaceConnectionId: conn._id,
    };
}

function normalizeAcendaOrder(o, conn) {
    return {
        orderNumber: o.order_number ?? String(o.id),
        orderId: String(o.id),
        orderKey: String(o.id),
        orderDate: o.created_at ? new Date(o.created_at) : new Date(),
        orderStatus: "awaiting_shipment",
        advancedOptions: { source: "acenda" },
        billTo: { name: "acenda" },
        shipTo: {
            name: o.shipping_address?.name ?? o.billing_address?.name ?? "not provided",
            street1: o.shipping_address?.address1 ?? "not provided",
            street2: o.shipping_address?.address2 ?? "",
            city: o.shipping_address?.city ?? "not provided",
            postalCode: o.shipping_address?.zip ?? "not provided",
            state: o.shipping_address?.province ?? "",
            country: o.shipping_address?.country_code ?? "US",
        },
        orderTotal: parseFloat(o.total_price ?? "0"),
        customerNotes: "",
        items: (o.line_items ?? o.items ?? []).flatMap(i =>
            Array.from({ length: parseInt(i.quantity ?? "1", 10) }, () => ({
                sku: i.sku ?? "",
                quantity: 1,
                orderItemId: String(i.id ?? i.line_item_id ?? Math.random()),
                unitPrice: parseFloat(i.price ?? "0"),
                name: i.title ?? i.name ?? "",
                upc: "",
                options: [],
            }))
        ),
        _marketplaceOrderId: String(o.id),
        _marketplaceConnectionId: conn._id,
    };
}

// ─── Pull from active marketplace connections ──────────────────────────────────
async function pullFromConnections() {
    const connections = await ApiKeyIntegrations.find({ pullOrdersEnabled: true }).lean();
    const orders = [];
    for (const conn of connections) {
        const type = conn.type?.toLowerCase();
        try {
            if (type === "faire") {
                const { orders: raw, error } = await getOrdersFaire({
                    apiKey: conn.apiKey,
                    excludedStates: "SHIPPED,CANCELED",
                    limit: 50,
                });
                if (!error) orders.push(...(raw ?? []).map(o => normalizeFaireOrder(o, conn)));
            } else if (type === "walmart") {
                const result = await getReleasedOrdersWalmart({ clientId: conn.apiKey, clientSecret: conn.apiSecret });
                if (!result.error) orders.push(...(result.orders ?? []).map(o => normalizeWalmartOrder(o, conn)));
            } else if (type === "etsy") {
                // getOpenReceiptsEtsy needs a live Mongoose document for token refresh
                const liveConn = await ApiKeyIntegrations.findById(conn._id);
                const data = await getOpenReceiptsEtsy(liveConn);
                orders.push(...(data?.results ?? []).map(o => normalizeEtsyOrder(o, conn)));
            } else if (type === "acenda" || conn.organization) {
                const { orders: raw, error } = await getShipAdviceAcenda({
                    clientId: conn.apiKey,
                    clientSecret: conn.apiSecret,
                    organization: conn.organization,
                    unacked: true,
                });
                if (!error) orders.push(...(raw ?? []).map(o => normalizeAcendaOrder(o, conn)));
            }
        } catch (e) {
            console.error(`pullFromConnections error for ${type}:`, e.message);
        }
    }
    return { orders, enabledTypes: new Set(connections.map(c => c.type?.toLowerCase()).filter(Boolean)) };
}

export async function pullOrders(){
    let colorFixer
    let sizeFixer
    let blankConverter
    let designFixer
    let skuFixer
    let designConverterDoc = await Converters.findOne({type: "design"});
    let blankConverterDoc = await Converters.findOne({type: "blank"});
    let colorConverterDoc = await Converters.findOne({type: "color"});
    let sizeConverterDoc = await Converters.findOne({type: "size"});
    let skuConverterDoc = await Converters.findOne({type: "sku"});
    if(blankConverterDoc && blankConverterDoc.converter) blankConverter = blankConverterDoc.converter;
    if(colorConverterDoc && colorConverterDoc.converter) colorFixer = colorConverterDoc.converter;
    if(sizeConverterDoc && sizeConverterDoc.converter) sizeFixer = sizeConverterDoc.converter;
    if(designConverterDoc && designConverterDoc.converter) designFixer = designConverterDoc.converter;
    if(skuConverterDoc && skuConverterDoc.converter) skuFixer = skuConverterDoc.converter? skuConverterDoc.converter: {};
    console.log("pulling orders")

    // Pull directly from enabled marketplace connections
    const { orders: marketplaceOrders, enabledTypes } = await pullFromConnections();

    // Pull from ShipStation, skipping sources handled by direct connections
    const ssRaw = await getOrders({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}` });
    const ssOrders = enabledTypes.size > 0
        ? ssRaw.filter(o => {
            const src = (o.advancedOptions?.source ?? o.billTo?.name ?? "").toLowerCase();
            return !enabledTypes.has(src);
        })
        : ssRaw;

    const orders = [...marketplaceOrders, ...ssOrders]
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
                paid: true,
                ...(o._marketplaceOrderId ? { marketplaceOrderId: o._marketplaceOrderId } : {}),
                ...(o._marketplaceConnectionId ? { marketplaceConnectionId: o._marketplaceConnectionId } : {}),
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
                    if (i.sku != "" && i.sku?.includes("_") && (!i.sku?.includes("PPSET") || i.sku?.includes("PPSET_C"))) {
                        let item
                        let sku = skuFixer[i.sku] ? skuFixer[i.sku] : i.sku;
                        let blankCode = sku.split("_")[0].trim();
                        let colorSku = sku.split("_")[1]?.trim();
                        let sizeName = sku.split("_")[2]?.trim();
                        let skuBroken = sku.split("_");
                        let designSku = skuBroken.slice(3, skuBroken.length).join("_");
                        console.log(blankCode, colorSku, sizeName, designSku, "broken sku")
                        let blank = await Blank.findOne({code: blankCode}).populate("colors").populate("blanks")
                        if(!blank) blank = await Blank.findOne({code: blankConverter[blankCode]? blankConverter[blankCode]: blankCode}).populate("colors").populate("blanks")
                        let color = blank?.colors.find(c => c.sku === colorSku.toLowerCase())
                        if(!color) color = blank?.colors.find(c => c.name.toLowerCase() === colorSku.toLowerCase())
                        if (!color) color = blank?.colors.find(c => c.name === colorSku)
                        if(!color) color = blank?.colors.find(c => c.name.toLowerCase() === colorFixer[colorSku]?.toLowerCase())
                        let size = blank?.sizes.find(s => s.name === sizeName || s.name === sizeFixer[sizeName] || s.sku === sizeName || s.sku === sizeFixer[sizeName])
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
                        if(blank && blank.type == "alias" && blank?.blanks.length > 0 && product){
                            if(blank?.blanks.length > 1){
                                throw new Error("Multiple blanks on alias, cannot determine which to use for item creation")
                            }else{
                                let variant = product.variantsArray.find(v => v.sku === newSku)
                                let aliasBlank = blank.blanks[0]
                                let aliasSize = aliasBlank.sizes.find(si => si.name === sizeName || si.sku === sizeName)
                                console.log(aliasBlank.code, aliasSize.name, aliasSize, "alias blank and size")
                                variant.blank = aliasBlank
                                variant.size = aliasSize._id 
                                item = await createItemVariant(variant, product, order, i.unitPrice)
                                items.push(item)
                            }

                        }else if (product) {
                            let variant = product.variantsArray.find(v => v.sku === newSku)
                            if (variant) {
                                item = await createItemVariant(variant, product, order, i.unitPrice)
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
                                if(blank?.blanks.length > 0){
                                    let aliasBlank = blank.blanks[0]
                                    let aliasSize = aliasBlank.sizes.find(s => s._id.toString() == blank.sizes.find(si => si.name === sizeName || si.name === sizeFixer[sizeName] || si.sku === sizeName || si.sku === sizeFixer[sizeName]).blankSizes[0]._id.toString())
                                    item = await createItem(i, order, aliasBlank, color, null, aliasSize, design, sku ? sku.sku : i.sku, isBlank)
                                    items.push(item)
                                }else{
                                    item = await createItem(i, order, blank, color, null, size, design, sku ? sku.sku : i.sku, isBlank)
                                    items.push(item)
                                }
                            }
                        }
                    } else if(i.sku?.includes("PPSET")){
                        let item
                        console.log(i.sku, "pp set sku")
                        const parts = i.sku.split("_")
                        const [pantBase, pantColor, pantSize, shirt, shirtColor] = parts
                        const pant = `${pantBase}_${shirt}`
                        const designSku = parts.slice(5).join("_")
                        console.log(pant, pantColor, pantSize, shirt, shirtColor, designSku, "broken pp set sku")
                        const findColor = (blank, colorSku) =>
                            blank?.colors.find(c => c.sku === colorSku.toLowerCase())
                            ?? blank?.colors.find(c => c.name.toLowerCase() === colorSku.toLowerCase())
                            ?? blank?.colors.find(c => c.name.toLowerCase() === colorFixer[colorSku]?.toLowerCase())
                        const findSize = (blank, sizeName) =>
                            blank?.sizes.find(s => s.name === sizeName || s.name === sizeFixer[sizeName])
                        const design = await Design.findOne({sku: designSku})
                        const blankPant = await Blank.findOne({ code: pant }).populate("colors")
                        const colorPant = findColor(blankPant, pantColor)
                        const sizePant = findSize(blankPant, pantSize)
                        const blankShirt = await Blank.findOne({ code: shirt }).populate("colors")
                        const colorShirt = findColor(blankShirt, shirtColor)
                        const sizeShirt = findSize(blankShirt, pantSize)
                        console.log(blankPant?.code, colorPant?.name, sizePant?.name, "pant info")
                        console.log(blankShirt?.code, colorShirt?.name, sizeShirt?.name, "shirt info")
                        item = await createItem(i, order, blankPant, colorPant, null, sizePant, null, i.sku, true)
                        items.push(item)
                        item = await createItem(i, order, blankShirt, colorShirt, null, sizePant, design, i.sku, !(design || designSku))
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
                    if(!i.sku){
                        console.log("no sku on item at all")
                        console.log(i, "item without sku")
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