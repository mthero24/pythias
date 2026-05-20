import {NextApiRequest, NextResponse} from "next/server"
import { Items } from "@pythias/mongo"
import { SkuToUpc } from "@pythias/mongo"
import { Order } from "@pythias/mongo"
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    console.log(data.item.blank)
    let item = await Items.findOneAndUpdate({_id: data.item._id}, {...data.item})
    let sku = await SkuToUpc.findOne({sku: item.sku})
    if(sku){
        sku.blank = item.blank
        sku.design = item.designRef
        sku.color = item.color
        sku.size = item.sizeName
        await sku.save()
    }
    let order = await Order.findOne({_id: item.order}).populate("items").lean()
    return NextResponse.json({error: false, order})
}