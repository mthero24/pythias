import {NextApiRequest, NextResponse} from "next/server"
import Items from "@/models/Items"
import SkuToUpc from "@/models/skuUpcConversion"
import Order from "@/models/Order"
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    console.log(data.item)
    let item = await Items.findOneAndUpdate({_id: data.item._id}, {...data.item})
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