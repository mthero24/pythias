import { style } from "@mui/system";
import {Products, SkuToUpc, ProductInventory, Blank, Design} from "@pythias/mongo"
import {NextApiRequest, NextResponse} from "next/server";

export async function POST(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    let blank = await Blank.findOne({_id: data.blank}).populate("colors")
    let color = blank.colors.find(c => c._id.toString() === data.color)
    let size = blank.sizes.find(s => s._id.toString() === data.size)
    let design = await Design.findOne({sku: data.designSku})
    console.log(blank.code, color.name, size.name, design.sku, "found items in returns route")
    if(blank && color && size && design){
        let productInventory = await ProductInventory.findOne({ sku: `${blank.code}_${color.sku}_${size.name}_${design.sku}` })
        let product = await Products.findOne({ variantsArr: {$elemMatch: {sku: `${blank.code}_${color.sku}_${size.name}_${design.sku}`}} }).populate("design", "sku images").populate("blanks", "sizes code multiImages images").populate("colors", "name")
        let variant
        if(product){
            variant = product.variantsArr.find(v => v.sku === `${blank.code}_${color.sku}_${size.name}_${design.sku}`)
        }else{
            let styleImages = []
            let designImages = Object.keys(design.images)
            for (let im of blank.images.filter(i=> i.color.toString() === color._id.toString())) {
                //console.log(Object.keys(im.boxes? im.boxes: {}), designImages.join("-"), "checking image boxes")
                if (Object.keys(im.boxes ? im.boxes : {}).filter(e => designImages.includes(e)).length > 0) {
                    styleImages.push({ blankImage: im, designImages: design.images, sides: designImages.join("_"), colorName: color.name })
                    break;
                }
            }
            let si = styleImages[0]
            variant = {
                image: `https://simplysage.pythiastechnologies.com/api/renderImages/${design.sku}-${blank.code?.replace(/-/g, "_")}-${si.blankImage?.image.split("/")[si.blankImage?.image.split("/").length - 1].split(".")[0]}-${si.colorName?.replace(/\//g, "_")}-${si.side ? si.side : si.sides}.jpg?width=400`,
                color: color,
                blank: blank,
                size: size._id,
                design: design,
                sku: `${blank.code}_${color.sku}_${size.name}_${design.sku}`,
                upc: "",
                price: size.price,
                unit_cost: 0,
                location: "returns",
            }
            console.log(variant.image, "constructed variant")
        }
        if(productInventory){
            productInventory.quantity += 1
            await productInventory.save()
            return NextResponse.json({ error: false, msg: "Inventory created and updated", productInventory: productInventory, variant: variant})
        }else{
            productInventory = new ProductInventory({
                quantity: 1,
                order_at_quantity: 0,
                pending_quantity: 0,
                quantity_to_order: 0,
                desired_order_quantity: 0,
                color: color._id,
                blank: blank._id,
                size: size._id,
                unit_cost: 0,
                location: "returns",
                sku: `${blank.code}_${color.sku}_${size.name}_${design.sku}`
            })
            await productInventory.save();
            return NextResponse.json({error: false, msg: "Inventory created and updated", productInventory: productInventory, variant: variant})
        }
    }else{
        return NextResponse.json({ error: true, msg: "Look up SKU or UPC on the design page!!!" }) 
    }

}