import Items from "@/models/Items";
import Order from "@/models/Order";
import {NextApiResponse, NextResponse} from "next/server";
import {Sort} from "@pythias/labels";
import { buildLabelData } from "@/functions/labelString";
import { LabelsData } from "@/functions/labels";
import Inventory from "@/models/inventory";
import {createPdf} from "@pythias/labels"
export async function POST(req=NextApiResponse) {
    let data = await req.json()
    //console.log(data)
    let inventoryArray = await Inventory.find({})
    .select("quantity pending_quantity inventory_id color_name size_name style_code row unit shelf bin")
    .lean();
    let items = await Items.find({batchID: data.batchID}).populate("designRef").lean()

    console.log(items.length, "length of items +++")
    let standardOrders = items.map(s=> s.order)
    console.log(standardOrders)
    //standardOrders = await Order.find({_id: {$in: standardOrders}}).select("poNumber items marketplace").lean()
    //console.log(standardOrders)
   // console.log(standardOrders.length, "standatd orders")
    items = items.map(s=> { s.order = standardOrders.filter(o=> o._id.toString() == s.order.toString())[0];  return {...s}})
    console.log(items.length, "before filter")
    items = items.filter(s=> s.order != undefined)
    items = items.map(s=> { s.inventory = inventoryArray.filter(i=> i.color_name == s.color.name && i.size_name == s.sizeName && i.style_code == s.styleCode)[0];  return {...s}})
    items = Sort(items)

    //full fill promises
     await createPdf({items: items, buildLabelData, localIP: process.env.localIP, key: "$2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO"})
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    //console.log(giftMessages)
    return NextResponse.json({error: false, msg: "reprinted", labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
}