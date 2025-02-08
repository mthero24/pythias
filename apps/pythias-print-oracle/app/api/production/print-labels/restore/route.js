import Items from "../../../../../models/Items";
import Order from "../../../../../models/Order";
import {NextApiResponse, NextResponse} from "next/server";
import {Sort} from "@pythias/labels";
import { buildLabelData } from "../../../../../functions/labelString";
import axios from "axios"
import { LabelsData } from "../../../../../functions/labels";
import btoa from "btoa"
export async function POST(req=NextApiResponse) {
    let data = await req.json()
    console.log(data)
    let labelsString = ``
    let items = await Items.find({batchID: data.batchID}).lean()
    console.log(items.length, "length of items +++")
    let standardOrders = items.map(s=> s.order)
    standardOrders = await Order.find({_id: {$in: standardOrders}}).select("poNumber items").lean()
    console.log(standardOrders.length, "standatd orders")
    items = items.map(s=> { s.order = standardOrders.filter(o=> o._id.toString() == s.order.toString())[0];  return {...s}})
    console.log(items.length, "before filter")
    items = items.filter(s=> s.order != undefined)
    items = Sort(items)
    console.log(items.length)
    let preLabels = items.map(async (i, j)=>{
        console.log(j)
        //if(j >= parseInt(data.lastIndex)){
            let label = await buildLabelData(i, j)
            //console.log(label)
            return label
        //}
    })

    // full fill promises
    preLabels = await Promise.all(preLabels);
    preLabels.slice(parseInt(data.lastIndex), preLabels.length).map(l=> labelsString += l)
    console.log(preLabels.length, "+++++++", preLabels.slice(parseInt(data.lastIndex), preLabels.length))
    //create label string
    //console.log(labelsString)
    //convert to base64
    labelsString = btoa(labelsString)

    //print labels
    console.log(process.env.localIP, process.env.localKey)
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localKey}`
        }
    }
    console.log(headers)
    let res = await axios.post(`http://${process.env.localIP}/api/print-labels`, {label: labelsString, printer: "printer1"}, headers).catch(e=>{console.log(e.response)})
    console.log(res?.data)
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    //console.log(giftMessages)
    return NextResponse.json({error: false, msg: "reprinted", labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
}