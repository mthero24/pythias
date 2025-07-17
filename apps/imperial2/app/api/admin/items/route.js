import {NextApiRequest, NextResponse} from "next/server"
import { Items, SkuToUpc, Order } from "@pythias/mongo";
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    console.log(data.item)
    let item = await Items.findOneAndUpdate({_id: data.item._id}, {...data.item})
    item = await Items.findOne({_id: data.item._id})
    console.log("here", item.design, Object.keys(item.design), Object.keys(item.design).length, !item.design && Object.keys(item.design).length == 0)
    if(!item.design && Object.keys(item.design).length == 0){
        console.log(data.item.design, "item design")
        item.design = data.item.design
        console.log(item.design, "design")
        item = await item.save()
    }
    //let relatedItems = await Items.find({sku: item.sku, threadColorName: item.threadColorName})
    console.log(item)
    // for(let it of relatedItems){
    //     if(!it.designRef || !it.design){
    //         it.designRef = data.item.designRef
    //         it.design = data.item.design
    //         console.log(it.design, it.designRef)
    //         await it.save()
    //     }
    // }
    let order = await Order.findOne({_id: item.order}).populate("items").lean()
    return NextResponse.json({error: false, order})
}