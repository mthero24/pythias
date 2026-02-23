import { Nightlife } from "@mui/icons-material";
import { Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory, ProductInventory, Items, Order, LicenseHolders, Converters } from "@pythias/mongo"
import axios from "axios";
import { pullOrders, updateInventory} from "@/functions/pullOrders"
import { getOrders, generatePieceID, getPages, getPageOrders } from "@pythias/integrations";
import { canceled } from "@/functions/itemFunctions";
import { style } from "@mui/system";
import inventory from "@/models/inventory";

const CreateSku = async ({blank, color, size, design, threadColor}) => {
    let sku = `${blank.code}_${color.sku}_${size?.name}${threadColor ? `_${threadColor}` : ""}${design? `_${design.sku}`: ""}`;
    return sku;
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
        options: variant.options[0]?.value,
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
    let item = new Items({
        pieceId: await generatePieceID(),
        paid: true,
        sku: i.sku,
        orderItemId: i.orderItemId,
        blank: blank,
        styleCode: blank?.code,
        sizeName: size && size.name ? size.name : blank?.sizes.find(s => s._id.toString() == size)?.name,
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
        isBlank: isBlank == true ? true : false
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

const addPriceToItem = async ()=>{
    let colorFixer
    let sizeFixer
    let blankConverter
    let designFixer
    let skuFixer
    let designConverterDoc = await Converters.findOne({ type: "design" });
    let blankConverterDoc = await Converters.findOne({ type: "blank" });
    let colorConverterDoc = await Converters.findOne({ type: "color" });
    let sizeConverterDoc = await Converters.findOne({ type: "size" });
    let skuConverterDoc = await Converters.findOne({ type: "sku" });
    if (blankConverterDoc && blankConverterDoc.converter) blankConverter = blankConverterDoc.converter;
    if (colorConverterDoc && colorConverterDoc.converter) colorFixer = colorConverterDoc.converter;
    if (sizeConverterDoc && sizeConverterDoc.converter) sizeFixer = sizeConverterDoc.converter;
    if (designConverterDoc && designConverterDoc.converter) designFixer = designConverterDoc.converter;
    if (skuConverterDoc && skuConverterDoc.converter) skuFixer = skuConverterDoc.converter ? skuConverterDoc.converter : {};
    let pages = await getPages({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}` })
    console.log(pages, "total pages")
    for (let p = 399; p <= pages; p++) {
        console.log("getting page", p)
        let orders = await getPageOrders({ auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`, page: p })
        console.log(orders.length, "orders on page", p)
        for (let order of orders) {
            let o = await Order.findOne({ poNumber: order.orderNumber }).populate("items").select("items")
            if (!o) {
                console.log("Order not found", order.orderNumber)
                continue;
            }
            let orderDiscount = 0
            for (let item of order.items) {
                if (item.unitPrice < 0) {
                    console.log(item.unitPrice)
                    orderDiscount += item.unitPrice / order.items.length
                }
            }
            console.log(orderDiscount, order.items.length)
            for (let item of order.items) {
                if (item.sku) {
                    let sku = skuFixer[item.sku] ? skuFixer[item.sku] : item.sku;
                    let blankCode = sku.split("_")[0]?.trim();
                    let colorSku = sku.split("_")[1]?.trim();
                    let sizeName = sku.split("_")[2]?.trim();
                    let skuBroken = sku.split("_");
                    let designSku = skuBroken.slice(3, skuBroken.length).join("_");
                    let blank = await Blank.findOne({ code: blankCode }).populate("colors")
                    if (!blank) blank = await Blank.findOne({ code: blankConverter[blankCode] ? blankConverter[blankCode] : blankCode }).populate("colors")
                    let color = blank?.colors.find(c => c.sku === colorSku?.toLowerCase())
                    if (!color) color = blank?.colors.find(c => c.name.toLowerCase() === colorSku?.toLowerCase())
                    if (!color) color = blank?.colors.find(c => c.name === colorSku)
                    if (!color) color = blank?.colors.find(c => c.name.toLowerCase() === colorFixer[colorSku]?.toLowerCase())
                    let size = blank?.sizes.find(s => s.name === sizeName || s.name === sizeFixer[sizeName])
                    let design = await Design.findOne({ sku: designSku })
                    if (!design) design = await Design.findOne({ sku: designFixer[designSku] ? designFixer[designSku] : designSku })
                    let newSku
                    if(blank && color && size)newSku = await CreateSku({ blank, color, size, design, designSku })
                    let items = o.items.filter(i => i.sku == newSku || i.sku == item.upc)
                    if (items.length == 0) {
                        console.log("SKU not found with new SKU or UPC", newSku, item.upc)
                        items = o.items.filter(i => i.sku == sku || i.sku == item.upc || i.name == item.name)
                    }
                    for (let i of items) {
                        console.log(i.pieceId, items.length, item.unitPrice, newSku)
                        i.price = item.unitPrice + orderDiscount
                        await i.save()
                    }
                } else if (item.name && item.unitPrice > 0) {
                    let items = o.items.filter(i => i.name == item.name)
                    for (let i of items) {
                        console.log(i.pieceId, items.length, item.unitPrice, item.name)
                        i.price = item.unitPrice + orderDiscount
                        await i.save()
                    }
                }
            }
            console.log(o.date, "done with order", p, "page")
            o = null;

        }
    }
    console.log("done updating prices")
}
export default async function Test(){
   //pullOrders();
    //addPriceToItem();
    return <h1>test</h1>
}