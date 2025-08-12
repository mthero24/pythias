import { Items, Order, Inventory } from "@pythias/mongo";
import {NextApiResponse, NextResponse} from "next/server";
import {Sort} from "@pythias/labels";
import { buildLabelData } from "@/functions/labelString";
import { LabelsData } from "@/functions/labels";
import {createPdf} from "@pythias/labels"
export async function POST(req=NextApiResponse) {
    let data = await req.json()
    console.log(data)
    let items = await Items.find({batchID: data.batchID}).populate("designRef inventory.inventory inventory.productInventory").lean()

    console.log(items.length, "length of items +++")
    let standardOrders = items.map(s=> s.order)
    console.log(standardOrders)
    //standardOrders = await Order.find({_id: {$in: standardOrders}}).select("poNumber items marketplace").lean()
    //console.log(standardOrders)
   // console.log(standardOrders.length, "standatd orders")
    items = items.map(s=> { s.order = standardOrders.filter(o=> o._id.toString() == s.order.toString())[0];  return {...s}})
    console.log(items.length, "before filter")
    items = items.filter(s=> s.order != undefined)
    items = Sort(items)

    //full fill promises
     await createPdf({items: items, buildLabelData, localIP: process.env.localIP, key: "$2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO", lastIndex: data.lastIndex, type: "reprint"})
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    //console.log(giftMessages)
    return NextResponse.json({error: false, msg: "reprinted", labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
}