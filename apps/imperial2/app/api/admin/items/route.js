import {NextApiRequest, NextResponse} from "next/server"
import { Items, SkuToUpc, Order, Inventory } from "@pythias/mongo";
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    //console.log(data.item)
    let item = await Items.findOneAndUpdate({_id: data.item._id}, {...data.item})
    item = await Items.findOne({_id: data.item._id}).populate("blank color")
    //console.log("here", item.design, Object.keys(item.design), Object.keys(item.design).length, !item.design && Object.keys(item.design).length == 0)
    if(item.design && Object.keys(item.design).length == 0){
        //console.log(data.item.design, "item design")
        item.design = data.item.design
        //console.log(item.design, "design")
        item = await item.save()
    }
    console.log(item.inventory.inventoryType, item.blank.code, item.color.name, item.size)
    if(!item.inventory.inventoryType && item.blank && item.color && item.size){
        let size = item.blank.sizes.filter(s => s._id.toString() == item.size.toString())[0]
        let inv = await Inventory.findOne({ blank: item.blank._id, color: item.color._id, sizeId: size._id })
        console.log(inv, "inv")
        if(inv && inv.quantity > 0){
            item.inventory = {
                inventoryType: "inventory",
                inventory: inv._id,
                productInventory: null,
            }
            item = await item.save()
            inv.quantity -= 1
            await inv.save()
        }else{
            if(!inv.attached) inv.attached = []
            if(!inv.attached.includes(item._id)){
                inv.attached.push(item._id)
                await inv.save()
            }
        }
    }
    //console.log(item)
    let order = await Order.findOne({_id: item.order}).populate("items").lean()
    return NextResponse.json({error: false, order})
}