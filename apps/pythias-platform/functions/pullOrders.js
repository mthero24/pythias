import { PlatformDesign as Design, PlatformItem as Item, PlatformBlank as Blank, PlatformOrder as Order, PlatformProduct as Products, PlatformInventory as Inventory, PlatformInventoryOrder as InventoryOrders, PlatformProductInventory as ProductInventory, Converters, ApiKeyIntegrations, TikTokAuth } from "@pythias/mongo";
import { getOrders, generatePieceID, getOrdersFaire, getReleasedOrdersWalmart, getOpenReceiptsEtsy, getShipAdviceAcenda, getOrdersEbay } from "@pythias/integrations";
import { logActivity, logError } from "@pythias/backend/server";
import { pullTikTokOrders } from "./tikTok";
import { getOrgCreds } from "@/lib/getOrgCreds";


// ── SKU resolution helpers ────────────────────────────────────────────────────
function resolveColor(blank, colorSku, colorFixer) {
    if (!blank?.colors || !colorSku) return null;
    return blank.colors.find(c => c.sku === colorSku.toLowerCase())
        ?? blank.colors.find(c => c.name?.toLowerCase() === colorSku.toLowerCase())
        ?? blank.colors.find(c => c.name?.toLowerCase() === colorFixer?.[colorSku]?.toLowerCase())
        ?? null;
}

function resolveSize(blank, sizeName, sizeFixer) {
    if (!blank?.sizes || !sizeName) return null;
    return blank.sizes.find(s =>
        s.name === sizeName || s.sku === sizeName ||
        s.name === sizeFixer?.[sizeName] || s.sku === sizeFixer?.[sizeName]
    ) ?? null;
}

function resolveAliasSize(aliasBlank, parentBlank, sizeName, sizeFixer) {
    // Try direct name/sku match in the alias blank first
    const direct = resolveSize(aliasBlank, sizeName, sizeFixer);
    if (direct) return direct;
    // Fall back: map via parent blank's blankSizes cross-reference
    const parentSize  = resolveSize(parentBlank, sizeName, sizeFixer);
    const blankSizeId = parentSize?.blankSizes?.[0]?._id?.toString();
    if (blankSizeId) {
        return aliasBlank.sizes?.find(s => s._id.toString() === blankSizeId) ?? null;
    }
    return null;
}

const CreateSku = async ({ blank, color, size, design, threadColor, designSku }) => {
    let sku = `${blank.code}_${color.sku}_${size.sku}${threadColor ? `_${threadColor}` : ""}${design ? `_${design.sku}` : ""}${!design && designSku ? `_${designSku}` : ""}`;
    return sku;
}
export const updateInventory = async () => {
    // Sort by soonest ship-by date first; fall back to order date so urgent orders get stock first
    const activeItems = await Item.find({
        "inventory.inventory": { $exists: true, $ne: null },
        labelPrinted: false, canceled: false, shipped: false, paid: true,
    }).select("_id inventory.inventory date shipByDate").lean();
    activeItems.sort((a, b) => new Date(a.shipByDate || a.date) - new Date(b.shipByDate || b.date));

    const itemsByInvId = {};
    for (const item of activeItems) {
        const invId = String(item.inventory?.inventory);
        if (!itemsByInvId[invId]) itemsByInvId[invId] = [];
        itemsByInvId[invId].push(String(item._id));
    }

    const inventories = await Inventory.find({}).lean();

    const ops = [];
    for (const inv of inventories) {
        const itemIds = itemsByInvId[String(inv._id)] || [];
        const quantity = Math.max(0, inv.quantity ?? 0);
        // Pure FIFO: oldest items fill stock slots; the "ordered" distinction is
        // handled separately by recomputeStockStatus using live InventoryOrders data.
        ops.push({
            updateOne: {
                filter: { _id: inv._id },
                update: { $set: { quantity, inStock: itemIds.slice(0, quantity), attached: itemIds.slice(quantity) } },
            },
        });
    }

    if (ops.length > 0) await Inventory.bulkWrite(ops, { ordered: false });
};

export const recomputeStockStatus = async () => {
    // Step 1: Find items with no inventory assigned and try to attach one
    const unattached = await Item.find({
        labelPrinted: false, canceled: false, shipped: false, paid: true,
        "inventory.inventory": null, "inventory.productInventory": null,
    }).select("_id blank color size colorName sizeName styleCode").lean();

    if (unattached.length) {
        const blanks  = [...new Set(unattached.map(i => i.blank).filter(Boolean))];
        const colors  = [...new Set(unattached.map(i => i.color).filter(Boolean))];
        const sizes   = [...new Set(unattached.map(i => i.size).filter(Boolean))];
        const invIds  = [...new Set(unattached.map(i => `${i.colorName}-${i.sizeName}-${i.styleCode}`).filter(s => s !== "--"))];

        const orClauses = [];
        if (blanks.length) orClauses.push({ blank: { $in: blanks }, color: { $in: colors }, sizeId: { $in: sizes } });
        if (invIds.length)  orClauses.push({ inventory_id: { $in: invIds } });

        const inventories = orClauses.length
            ? await Inventory.find({ $or: orClauses }).lean()
            : [];

        const byBCS   = new Map(inventories.map(inv => [`${inv.blank}-${inv.color}-${inv.sizeId}`, inv]));
        const byInvId = new Map(inventories.filter(inv => inv.inventory_id).map(inv => [inv.inventory_id, inv]));

        const attachOps = [];
        for (const item of unattached) {
            const bcsKey   = item.blank && item.color && item.size ? `${item.blank}-${item.color}-${item.size}` : null;
            const invIdKey = `${item.colorName}-${item.sizeName}-${item.styleCode}`;
            const found = (bcsKey && byBCS.get(bcsKey)) ?? byInvId.get(invIdKey) ?? null;
            if (found) {
                attachOps.push({ updateOne: {
                    filter: { _id: item._id },
                    update: { $set: { "inventory.inventory": found._id, "inventory.inventoryType": "inventory" } },
                }});
            }
        }
        if (attachOps.length) await Item.bulkWrite(attachOps, { ordered: false });
    }

    // Step 2: Compute stock status for all inventory-backed items (including just-attached ones)
    const [allWithInv, productInvItems] = await Promise.all([
        Item.find({
            labelPrinted: false, canceled: false, shipped: false, paid: true,
            "inventory.inventory": { $exists: true, $ne: null },
        }).select("_id inventory.inventory stockStatus date shipByDate").lean(),
        Item.find({
            labelPrinted: false, canceled: false, shipped: false, paid: true,
            "inventory.productInventory": { $exists: true, $ne: null },
            stockStatus: { $ne: "inStock" },
        }).select("_id").lean(),
    ]);

    // Sort by soonest ship-by date first so urgent orders claim inStock slots first
    allWithInv.sort((a, b) => new Date(a.shipByDate || a.date) - new Date(b.shipByDate || b.date));

    const updateOps = [];

    if (allWithInv.length) {
        const allInvIds = [...new Set(allWithInv.map(i => i.inventory.inventory.toString()))];
        const [allInvDocs, activeOrders] = await Promise.all([
            Inventory.find({ _id: { $in: allInvIds } }, "quantity allocated").lean(),
            InventoryOrders.find(
                { received: { $ne: true }, "locations.items.inventory": { $in: allInvIds } },
                "locations"
            ).lean(),
        ]);

        const orderedCapMap = new Map();
        for (const po of activeOrders) {
            for (const loc of po.locations || []) {
                if (loc.received) continue;
                for (const item of loc.items || []) {
                    const k = item.inventory?.toString();
                    if (!k) continue;
                    orderedCapMap.set(k, (orderedCapMap.get(k) ?? 0) + (item.quantity ?? 0));
                }
            }
        }

        const invMap = new Map(allInvDocs.map(inv => [inv._id.toString(), {
            quantity: Math.max(0, inv.quantity ?? 0),
            orderedCapacity: orderedCapMap.get(inv._id.toString()) ?? 0,
            slotsUsed: 0,
            orderedUsed: 0,
        }]));

        for (const item of allWithInv) {
            const invId = item.inventory.inventory.toString();
            const data = invMap.get(invId);
            if (!data) continue;
            let computed;
            if (data.slotsUsed < data.quantity) { computed = "inStock"; data.slotsUsed++; }
            else if (data.orderedUsed < data.orderedCapacity) { computed = "ordered"; data.orderedUsed++; }
            else { computed = "attached"; }
            if (item.stockStatus !== computed) {
                updateOps.push({ updateOne: { filter: { _id: item._id }, update: { $set: { stockStatus: computed } } } });
            }
        }
    }

    // productInventory items are pre-reserved at order time — always inStock
    for (const item of productInvItems) {
        updateOps.push({ updateOne: { filter: { _id: item._id }, update: { $set: { stockStatus: "inStock" } } } });
    }

    if (updateOps.length) await Item.bulkWrite(updateOps, { ordered: false });

    // Anything still without inventory after the attachment pass → noInv
    await Item.updateMany(
        { labelPrinted: false, canceled: false, shipped: false, paid: true,
          "inventory.inventory": null, "inventory.productInventory": null,
          stockStatus: { $ne: "noInv" } },
        { $set: { stockStatus: "noInv" } }
    );
};
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
        sku: sku || i.sku,
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

// ─── Shared item-building loop ────────────────────────────────────────────────
async function buildItems(o, order, { colorFixer, sizeFixer, designFixer, skuFixer, blankConverter }) {
    const items = [];
    for (const i of o.items) {
        for (let j = 0; j < parseInt(i.quantity); j++) {

            if (i.sku?.includes("_") && (!i.sku.includes("PPSET") || i.sku.includes("PPSET_C"))) {
                // ── Standard underscore SKU: BLANK_COLOR_SIZE[_DESIGN] ───────
                const rawSku    = skuFixer?.[i.sku] ?? i.sku;
                const parts     = rawSku.split("_");
                const blankCode = parts[0].trim();
                const colorSku  = parts[1]?.trim() ?? "";
                const sizeName  = parts[2]?.trim() ?? "";
                const designSku = parts.slice(3).join("_");

                let blank = await Blank.findOne({ code: blankCode }).populate("colors").populate({ path: "blanks", populate: { path: "colors" } });
                if (!blank) blank = await Blank.findOne({ code: blankConverter?.[blankCode] ?? blankCode }).populate("colors").populate({ path: "blanks", populate: { path: "colors" } });

                const color = resolveColor(blank, colorSku, colorFixer);
                const size  = resolveSize(blank, sizeName, sizeFixer);
                let design  = await Design.findOne({ sku: designSku });
                if (!design && designSku) design = await Design.findOne({ sku: designFixer?.[designSku] ?? designSku });

                console.log(`SKU: blank=${blank?.code} color=${color?.name} size=${size?.name} design=${design?.sku}`);

                const isBlank = !(design || designSku);
                let newSku, product;

                if (blank && color && size) {
                    newSku  = await CreateSku({ blank, color, size, design, designSku });
                    product = await Products.findOne({ variantsArray: { $elemMatch: { sku: newSku } } })
                        .populate("design", "sku images")
                        .populate("design variantsArray.blank variantsArray.color")
                        .populate("blanks colors threadColors design");
                }

                if (blank?.type === "alias" && blank.blanks?.length > 0 && product) {
                    const variant = product.variantsArray.find(v => v.sku === newSku);
                    if (!variant) {
                        console.log(`No variant for sku ${newSku}`);
                    } else {
                        for (const ab of blank.blanks) {
                            const ac = resolveColor(ab, colorSku, colorFixer) ?? color;
                            const as = resolveAliasSize(ab, blank, sizeName, sizeFixer);
                            if (!as) { console.error(`Size "${sizeName}" not found in alias blank ${ab.code} — skipping`); continue; }
                            const subSku = `${ab.code}_${ac?.sku ?? colorSku}_${as.sku ?? sizeName}${designSku ? `_${designSku}` : ""}`;
                            console.log(`Alias (product): blank=${ab.code} color=${ac?.name} size=${as.name} sku=${subSku}`);
                            items.push(await createItemVariant({ ...variant, blank: ab, color: ac, size: as._id, sku: subSku }, product, order, i.unitPrice));
                        }
                    }

                } else if (product) {
                    const variant = product.variantsArray.find(v => v.sku === newSku);
                    if (variant) {
                        items.push(await createItemVariant(variant, product, order, i.unitPrice));
                        if (blank?.code?.includes("PPSET")) {
                            const sb = await Blank.findOne({ code: blank.code.split("_")[1] });
                            items.push(await createItem(i, order, sb, color, null, size, design, rawSku, !product.design));
                        } else if (blank?.code === "LGDSET") {
                            const sb = await Blank.findOne({ code: "LGDSWT" });
                            items.push(await createItem(i, order, sb, color, null, size, design, rawSku, !product.design));
                        }
                    }

                } else {
                    console.log(`No product: blank=${blank?.code} color=${color?.name} size=${size?.name} design=${design?.sku}`);
                    i.sku = newSku ?? i.sku;

                    if (blank?.code?.includes("PPSET")) {
                        const sb = await Blank.findOne({ code: blank.code.split("_")[1] });
                        items.push(await createItem(i, order, sb,    color, null, size, design, rawSku, isBlank));
                        items.push(await createItem(i, order, blank, color, null, size, design, rawSku, isBlank));
                    } else if (blank?.code === "LGDSET") {
                        const sb = await Blank.findOne({ code: "LGDSWT" });
                        items.push(await createItem(i, order, sb,    color, null, size, design, rawSku, isBlank));
                        items.push(await createItem(i, order, blank, color, null, size, design, rawSku, isBlank));
                    } else if (blank?.type === "alias" && blank.blanks?.length > 0) {
                        for (const ab of blank.blanks) {
                            const ac = resolveColor(ab, colorSku, colorFixer) ?? color;
                            const as = resolveAliasSize(ab, blank, sizeName, sizeFixer);
                            if (!as) console.error(`Size "${sizeName}" not found in alias blank ${ab.code} — item may lack size`);
                            const subSku = `${ab.code}_${ac?.sku ?? colorSku}_${as?.sku ?? sizeName}${designSku ? `_${designSku}` : ""}`;
                            console.log(`Alias (no product): blank=${ab.code} color=${ac?.name} size=${as?.name} sku=${subSku}`);
                            items.push(await createItem(i, order, ab, ac, null, as, design, subSku, isBlank));
                        }
                    } else {
                        items.push(await createItem(i, order, blank, color, null, size, design, rawSku, isBlank));
                    }
                }

            } else if (i.sku?.includes("PPSET")) {
                // ── PPSET multi-piece set SKU ─────────────────────────────────
                const parts      = i.sku.split("_");
                const [pantBase, pantColor, pantSize, shirt, shirtColor] = parts;
                const pant       = `${pantBase}_${shirt}`;
                const designSku  = parts.slice(5).join("_");
                const design     = designSku ? await Design.findOne({ sku: designSku }) : null;
                const blankPant  = await Blank.findOne({ code: pant  }).populate("colors");
                const blankShirt = await Blank.findOne({ code: shirt }).populate("colors");
                const colorPant  = resolveColor(blankPant,  pantColor,  colorFixer);
                const colorShirt = resolveColor(blankShirt, shirtColor, colorFixer);
                const sizePant   = resolveSize(blankPant, pantSize, sizeFixer);
                console.log(`PPSET: pant=${blankPant?.code}/${colorPant?.name}/${sizePant?.name} shirt=${blankShirt?.code}/${colorShirt?.name}`);
                items.push(await createItem(i, order, blankPant,  colorPant,  null, sizePant, null,   i.sku, true));
                items.push(await createItem(i, order, blankShirt, colorShirt, null, sizePant, design, i.sku, !(design || designSku)));

            } else if (i.sku || i.upc) {
                // ── UPC / non-underscore SKU lookup ──────────────────────────
                const product = await Products.findOne({
                    $or: [
                        { variantsArray: { $elemMatch: { upc: i.upc } } },
                        { variantsArray: { $elemMatch: { upc: i.sku } } },
                        { variantsArray: { $elemMatch: { sku: i.sku } } },
                    ],
                }).populate("design", "sku images")
                  .populate("design variantsArray.blank variantsArray.color")
                  .populate("blanks colors threadColors design");

                if (product) {
                    const variant = product.variantsArray.find(v =>
                        v.upc === i.upc || v.upc === i.sku || v.sku === i.sku || v.sku === i.upc
                    );
                    if (variant) {
                        items.push(await createItemVariant(variant, product, order, i.unitPrice));
                        const isBlank = !product.design;
                        if (variant.blank?.code?.includes("PPSET")) {
                            const sb = await Blank.findOne({ code: variant.blank.code.split("_")[1] });
                            items.push(await createItem(i, order, sb, variant.color, variant.threadColor, variant.size, product.design, variant.sku ?? i.sku, isBlank));
                        } else if (variant.blank?.code === "LGDSET") {
                            const sb = await Blank.findOne({ code: "LGDSWT" });
                            items.push(await createItem(i, order, sb, variant.color, variant.threadColor, variant.size, product.design, variant.sku ?? i.sku, isBlank));
                        }
                    } else {
                        console.log(`No matching variant for upc=${i.upc} sku=${i.sku} — creating unmatched item`);
                        items.push(await createItem(i, order, null, null, null, null, null, i.sku, true));
                    }
                } else {
                    console.log(`No product for upc=${i.upc} sku=${i.sku} — creating unmatched item`);
                    items.push(await createItem(i, order, null, null, null, null, null, i.sku, true));
                }

            } else {
                console.log("Item has no sku or upc:", i);
            }
        }
    }
    return items;
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
        _orgId: conn.orgId,
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
        _orgId: conn.orgId,
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
        _orgId: conn.orgId,
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
        _orgId: conn.orgId,
    };
}

function normalizeEbayOrder(o, conn) {
    const addr = o.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo ?? {};
    const lines = (o.lineItems ?? []).flatMap(li =>
        Array.from({ length: li.quantity ?? 1 }, () => ({
            sku:         li.sku ?? li.legacyItemId ?? "",
            quantity:    1,
            orderItemId: li.lineItemId,
            unitPrice:   parseFloat(li.lineItemCost?.value ?? "0"),
            name:        li.title ?? "",
            upc:         "",
            options:     (li.variationAspects ?? []).map(v => ({ value: v.value })),
        }))
    );
    return {
        orderNumber: o.orderId,
        orderId:     o.orderId,
        orderKey:    o.orderId,
        orderDate:   o.creationDate ? new Date(o.creationDate) : new Date(),
        orderStatus: "awaiting_shipment",
        advancedOptions: { source: "ebay" },
        billTo: { name: "ebay" },
        shipTo: {
            name:       addr.fullName ?? "not provided",
            street1:    addr.contactAddress?.addressLine1 ?? "not provided",
            street2:    addr.contactAddress?.addressLine2 ?? "",
            city:       addr.contactAddress?.city ?? "not provided",
            postalCode: addr.contactAddress?.postalCode ?? "not provided",
            state:      addr.contactAddress?.stateOrProvince ?? "",
            country:    addr.contactAddress?.countryCode ?? "US",
        },
        orderTotal: parseFloat(o.pricingSummary?.total?.value ?? "0"),
        customerNotes: o.buyerCheckoutNotes ?? "",
        items: lines,
        _marketplaceOrderId:    o.orderId,
        _marketplaceConnectionId: conn._id,
        _orgId: conn.orgId,
        _ebayLineItemIds: (o.lineItems ?? []).map(li => li.lineItemId),
    };
}

// ─── Pull from active marketplace connections ──────────────────────────────────
// Pull every enabled connection for ONE org. ShipStation is pulled separately from the org's
// own credentials in OrgIntegrations (the shipping/hardware settings) — only if that org has
// stored SS creds. Direct-marketplace orders are normalized; SS orders are returned raw (the
// main loop already understands the SS shape) and both are tagged with the org's id.
async function pullFromConnections(orgId) {
    const connections = await ApiKeyIntegrations.find({ pullOrdersEnabled: true, orgId }).lean();
    const orders = [];
    const ssOrders = [];
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
            } else if (type === "ebay") {
                const liveConn = await ApiKeyIntegrations.findById(conn._id);
                const raw = await getOrdersEbay(liveConn);
                orders.push(...raw.map(o => normalizeEbayOrder(o, conn)));
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
            logError({ error: e, app: "platform", provider: "platform", source: "pullOrders.pullFromConnections", context: { orgId, type } });
            console.error(`pullFromConnections error for ${type} (org ${orgId}):`, e.message);
        }
    }

    // ShipStation: pull only if the org has stored its own SS credentials in the
    // shipping/hardware settings (OrgIntegrations.shipstation). No creds → skip SS entirely.
    try {
        const orgCreds = await getOrgCreds(orgId);
        const ss = orgCreds?.shipstation;
        if (ss?.apiKey && ss?.apiSecret) {
            const raw = await getOrders({ auth: `${ss.apiKey}:${ss.apiSecret}` });
            ssOrders.push(...(raw ?? []).map(o => ({ ...o, _orgId: orgId })));
        }
    } catch (e) {
        logError({ error: e, app: "platform", provider: "platform", source: "pullOrders.pullFromConnections ShipStation", context: { orgId } });
        console.error(`pullFromConnections ShipStation error (org ${orgId}):`, e.message);
    }

    // enabledTypes drives the SS dedup filter — only the direct-marketplace sources belong here.
    const enabledTypes = new Set(
        connections.map(c => c.type?.toLowerCase()).filter(Boolean)
    );
    return { orders, ssOrders, enabledTypes };
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

    // Pull PER ORG (not all at once): each org's own connections + TikTok are pulled and
    // ingested separately, scoped to that org and isolated so one org's failure can't block
    // the others. ShipStation is pulled only for orgs that have their own SS connection.
    const [connOrgIds, tiktokOrgIds] = await Promise.all([
        ApiKeyIntegrations.distinct("orgId", { pullOrdersEnabled: true }),
        TikTokAuth.distinct("orgId", {}),
    ]);
    const orgIds = [...new Set([...connOrgIds, ...tiktokOrgIds].filter(Boolean).map(String))];
    console.log(`[pullOrders] pulling for ${orgIds.length} org(s)`);

    for (const orgId of orgIds) {
      try {
        // Direct-marketplace + per-org ShipStation connections for this org
        const { orders: marketplaceOrders, ssOrders: ssRaw, enabledTypes } = await pullFromConnections(orgId);

        // TikTok for this org (its own API). `active` => also filter TikTok out of this
        // org's SS pull as a safety net against double-ingestion.
        let tikTokActive = false;
        try {
            const tikTokResult = await pullTikTokOrders(orgId);
            tikTokActive = tikTokResult.active;
            console.log(`[pullOrders] org ${orgId}: TikTok pulled ${tikTokResult.pulled} order(s), active=${tikTokActive}`);
        } catch (e) {
            logError({ error: e, app: "platform", provider: "platform", source: "pullOrders TikTok pull", context: { orgId } });
            console.error(`[pullOrders] org ${orgId} TikTok pull failed:`, e.message);
        }

        // Filter this org's SS orders: drop sources already handled by its direct
        // connections, and TikTok when it's pulled directly.
        const ssOrders = (enabledTypes.size > 0 || tikTokActive)
            ? ssRaw.filter(o => {
                const src = (o.advancedOptions?.source ?? o.billTo?.name ?? "").toLowerCase();
                if (tikTokActive && (src.includes("tiktok") || src.includes("tik tok"))) return false;
                return !enabledTypes.has(src);
            })
            : ssRaw;

        const orders = [...marketplaceOrders, ...ssOrders]
    for(let o of orders){
        o._orgId = o._orgId ?? orgId;
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
                shippingType: ["faire", "TSC", "Zulily", "fashiongo", "fashion go", "FashionGo"].includes(marketplace) ? "Expedited" : "Standard",
                marketplace: o.orderNumber.toLowerCase().includes("cs")? "customer service entry": o.advancedOptions.source? o.advancedOptions.source: o.billTo.name,
                total: o.orderTotal,
                shippingCost: o.shippingAmount ?? 0,
                discountAmount: Math.max(0, (o.orderTotal ?? 0) - (o.amountPaid ?? o.orderTotal ?? 0)),
                productCost: (o.amountPaid ?? o.orderTotal ?? 0) - (o.shippingAmount ?? 0) - (o.taxAmount ?? 0),
                paid: true,
                ...(o._orgId ? { orgId: o._orgId } : {}),
                ...(o._marketplaceOrderId ? { marketplaceOrderId: o._marketplaceOrderId } : {}),
                ...(o._marketplaceConnectionId ? { marketplaceConnectionId: o._marketplaceConnectionId } : {}),
                ...(o._ebayLineItemIds?.length ? { ebayLineItemIds: o._ebayLineItemIds } : {}),
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
            const items = await buildItems(o, order, { colorFixer, sizeFixer, designFixer, skuFixer, blankConverter });
            order.items = items
            order = await order.save()
            logActivity({ action: "order_received", entity: "order", entityId: order._id, entityName: order.poNumber || "", userName: "system", provider: "premierPrinting" });
            items.map(async i => {
                i.order = order._id
                if (o._orgId) i.orgId = o._orgId
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
      } catch (e) {
        logError({ error: e, app: "platform", provider: "platform", source: "pullOrders", context: { orgId } });
        console.error(`[pullOrders] org ${orgId} failed:`, e.message);
      }
    }
    await updateInventory();
    await recomputeStockStatus();
}

export async function repullOrderItems(poNumber) {
    const [blankConverterDoc, colorConverterDoc, sizeConverterDoc, designConverterDoc, skuConverterDoc] = await Promise.all([
        Converters.findOne({ type: "blank" }),
        Converters.findOne({ type: "color" }),
        Converters.findOne({ type: "size" }),
        Converters.findOne({ type: "design" }),
        Converters.findOne({ type: "sku" }),
    ]);
    const converters = {
        blankConverter: blankConverterDoc?.converter,
        colorFixer:     colorConverterDoc?.converter,
        sizeFixer:      sizeConverterDoc?.converter,
        designFixer:    designConverterDoc?.converter,
        skuFixer:       skuConverterDoc?.converter ?? {},
    };

    const order = await Order.findOne({ poNumber });
    if (!order) throw new Error(`Order not found in DB: ${poNumber}`);

    // Use the owning org's ShipStation credentials (shipping/hardware settings).
    const orgCreds = order.orgId ? await getOrgCreds(order.orgId) : null;
    const ss = orgCreds?.shipstation;
    if (!ss?.apiKey || !ss?.apiSecret) throw new Error(`No ShipStation credentials for org ${order.orgId}`);
    const ssOrders = await getOrders({ auth: `${ss.apiKey}:${ss.apiSecret}`, id: poNumber });
    if (!ssOrders?.length) throw new Error(`Order not found in ShipStation: ${poNumber}`);
    const o = ssOrders[0];
    console.log(`[repullOrderItems] ${poNumber}: SS order has ${o.items.length} line(s)`);

    const items = await buildItems(o, order, converters);
    order.items = items;
    await order.save();
    await Promise.all(items.map(item => { item.order = order._id; if (order.orgId) item.orgId = order.orgId; return item.save(); }));
    logActivity({ action: "order_items_repulled", entity: "order", entityId: order._id, entityName: poNumber, userName: "system", provider: "premierPrinting" });

    console.log(`[repullOrderItems] ${poNumber}: created ${items.length} items`);
    return { count: items.length, ssItemCount: o.items.length, ssItems: o.items.map(i => ({ sku: i.sku, upc: i.upc, qty: i.quantity })) };
}
