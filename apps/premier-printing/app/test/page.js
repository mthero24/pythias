import { Nightlife } from "@mui/icons-material";
import { Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory, ProductInventory, Items, Order, LicenseHolders } from "@pythias/mongo"
import axios from "axios";
import { pullOrders, updateInventory} from "@/functions/pullOrders"
import { getOrders, generatePieceID } from "@pythias/integrations";
import { canceled } from "@/functions/itemFunctions";
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
let colorFixer = {
    LtGreen: "Light Green",
    BLUEJEAN: "Blue Jean",
    "BlueJean": "Blue Jean",
    ICEBLUE: "Ice Blue",
    IceBlue: "Ice Blue",
    "Army": "Army Green",
    "ARMY": "Army Green",
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
    VintageBlack: "Vintage Black",
    VintageRed: "Vintage Red",
    VintageNavy: "Vintage Navy",
    "Vintage/Red": "Vintage Red",
    "Vintage/Navy": "Vintage Navy",
    "VINTAGEMUSTARD": "Vintage Mustard",
    "VINTAGE/BLACK": "Vintage Black",
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
    AUTUMN: "Autumn",
    "ORANGE": "Orange",
    "PURPLE": "Purple",
    "ChalkyMint": "Chalky Mint",
    "HGREEN": "Heather Green",
    "SAGE": "Sage",
    "NAVY": "Navy",
    "MIDNIGHT": "Midnight",
    "DkGreen": "Dark Green",
    "DKGREEN": "Dark Green",
    "TERRACOTTA": "Terracotta",
    "MAUVE": "Mauve",
    "DUSTYROSE": "Dusty Rose",
    "LTPINK": "Light Pink",
    "LTBLUE": "Light Blue",
    "DkBlue": "Dark Blue",
    MILITARY: "Military",
    "DKBLUE": "Dark Blue",
    "LTYELLOW": "Light Yellow",
    "ORCHID": "Orchid",
    "FUCHSIA": "Fuchsia",
    "DkPurple": "Dark Purple",
    CHAMBRAY: "Chambray",
    "DKPURPLE": "Dark Purple",
    "LTORANGE": "Light Orange",
    "BLUSH": "Blush",
    "TAN": "Tan",
    "BURGUNDY": "Burgundy",
    "HotPink": "Hot Pink",
    "LTGREEN": "Light Green",
    "DkHeather": "Dark Heather",
    "HFOREST": "Forest",
    "CHARCOAL": "Charcoal",
    "H. Maroon": "Heather Maroon",
    "Lt. Pink": "Light Pink",
    Grey: "Heather Grey",
    BrightSalmon: "Bright Salmon",
    "Bluespruce": "Blue Spruce",

}
const sizeFixer = {
    "5/6": "5/6T",
    "5T": "5/6T",
    "15x16": "One Size",
    "YOUTH": "Youth",
    Small: "S",
    Medium: "M",
    Large: "L",
    XLarge: "XL",
    XXLarge: "2XL",
    YXS: "XS",
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
let blankConverter = {
    "TLS": "RSTLS",
    "MGDT": "GDT",
    "YLS": "RSYLS",
    BCSWT: "SWT",
}
const CreateSku = async ({blank, color, size, design, threadColor}) => {
    let sku = `${blank.code}_${color.sku}_${size.name}${threadColor ? `_${threadColor}` : ""}${design? `_${design.sku}`: ""}`;
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
    let item = new Item({
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
export default async function Test(){
   // await pullOrders();
    /* let items = await Items.find({
        pieceId: { $in: ["0RZ1JX7FS",]}});
    for(let item of items){
        if(item.sku && item.sku.includes("_")){
            console.log(item.sku, "item sku")
            let sku = item.sku;
            let blankCode = sku.split("_")[0];
            let colorSku = sku.split("_")[1];
            let sizeName = sku.split("_")[2];
            let skuBroken = sku.split("_");
            let designSku = skuBroken.slice(3, skuBroken.length).join("_");
            if(blankCode == "PPSET") continue;
            console.log(blankCode, colorSku, sizeName, designSku, "broken sku")
            let blank = await Blank.findOne({code: blankCode}).populate("colors")
            if(!blank) blank = await Blank.findOne({code: blankConverter[blankCode]? blankConverter[blankCode]: blankCode}).populate("colors")
            let color = blank.colors.find(c => c.sku === colorSku.toLowerCase())
            if(!color) color = blank.colors.find(c => c.name.toLowerCase() === colorSku.toLowerCase())
            if(!color) color = blank.colors.find(c => c.name.toLowerCase() === colorFixer[colorSku]?.toLowerCase())
            let size = blank.sizes.find(s => s.name === sizeName || s.name === converter[sizeName] || s.name === sizeFixer[sizeName])
            let design = await Design.findOne({sku: designSku})
            console.log(blank.code, color.name, size.name, design?.sku, "found items")
            let newSku = await CreateSku({blank, color, size, design})
            console.log(newSku, newSku == "SWT_hmaroon_M_12092M_F", "new sku")
            let product = await Products.findOne({ variantsArray: { $elemMatch: { sku: newSku } } }).populate("design", "sku images").populate("design variantsArray.blank variantsArray.color").populate("blanks colors threadColors design")
            console.log(product, "found product")
            if(product){
                let variant = product.variantsArray.find(v => v.sku === newSku)
                if(variant){
                    item.sku = variant.sku;
                    item.blank = variant.blank
                    item.color = variant.color
                    item.styleCode = variant.blank.code
                    item.colorName = variant.color.name
                    item.sizeName = variant.blank.sizes.find(s => s._id.toString() === variant.size.toString()).name
                    item.size = variant.size
                    item.designRef = product.design
                    item.design = product.design?.images
                    item.isBlank = product.design ? false : true
                    item.updated = true
                    let productInventory = await ProductInventory.findOne({ sku: newSku })
                    if (productInventory && productInventory.quantity - productInventory.inStock.length > 0) {
                        item.inventory = {
                            inventoryType: "productInventory",
                            productInventory: productInventory._id
                        }
                        productInventory.inStock.push(item._id.toString())
                        await productInventory.save()

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
                            await item.save()
                        }
                    }
                    await item.save()
                   // console.log(item, "updated item with product variant")
                }
            }else{
                console.log("no product found")
                console.log(blank.code, color.name, size.name, design?.sku, "found items")
                item.sku = newSku;
                item.blank = blank
                item.color = color
                item.size = size
                item.designRef = design
                item.design = design?.images
                item.styleCode = blank.code
                item.colorName = color.name
                item.sizeName = size.name
                item.updated = true
                item.isBlank = design || (designSku && !designSku ==="") ? false : true
                let productInventory = await ProductInventory.findOne({ sku: newSku })
                if (productInventory && productInventory.quantity - productInventory.inStock.length > 0) {
                    item.inventory = {
                        inventoryType: "productInventory",
                        productInventory: productInventory._id
                    }
                    productInventory.inStock.push(item._id.toString())
                    await productInventory.save()
                }else{
                    let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size })
                    if (!inventory) {
                        inventory = await Inventory.findOne({ inventory_id: `${item.colorName}-${item.sizeName}-${item.styleCode}` })
                    }
                    if (inventory) {
                        if (!item.inventory) item.inventory = {}
                        item.inventory.inventoryType = "inventory"
                        item.inventory.inventory = inventory._id
                        console.log(inventory.attached, "inventory to save")
                        await item.save()
                    }
                }
                await item.save()
            }
        }else{
            console.log("no sku on item")
            console.log(item, "item without sku")
            if(item.upc || item.sku){
                console.log("has upc or sku")
                let product = await Products.findOne({ $or: [{ variantsArray: { $elemMatch: { upc: item.upc } } }, { variantsArray: { $elemMatch: { upc: item.sku } } }] }).populate("design", "sku images").populate("design variantsArray.blank variantsArray.color").populate("blanks colors threadColors design")
                console.log(product, "found product by upc or sku")
                if (product) {
                    let variant = product.variantsArray.find(v => v.upc === item.upc || v.upc === item.sku)
                    if (variant) {
                        item.sku = variant.sku;
                        item.blank = variant.blank
                        item.color = variant.color
                        item.styleCode = variant.blank.code
                        item.colorName = variant.color.name
                        item.sizeName = variant.blank.sizes.find(s => s._id.toString() === variant.size.toString()).name
                        item.size = variant.size
                        item.designRef = product.design
                        item.design = product.design?.images
                        item.isBlank = product.design ? false : true
                        item.updated = true
                        let productInventory = await ProductInventory.findOne({ sku: variant.sku })
                        if (productInventory && productInventory.quantity - productInventory.inStock.length > 0) {
                            item.inventory = {
                                inventoryType: "productInventory",
                                productInventory: productInventory._id
                            }
                            productInventory.inStock.push(item._id.toString())
                            await productInventory.save()

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
                                await item.save()
                            }
                        }
                        await item.save()
                        // console.log(item, "updated item with product variant")
                    }
                }
            }
        }
    } */
    return <h1>test</h1>
}