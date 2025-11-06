import { NextApiRequest, NextResponse } from "next/server";
import Items from "../../../../models/Items";
import Batches from "../../../../models/batches";
import { LabelsData } from "../../../../functions/labels";
import btoa from "btoa";
import axios from "axios";
import {buildLabelData} from "../../../../functions/labelString"
import { Inventory } from "@pythias/mongo";
import inventory from "@/models/inventory";
let letters = ["a", "b", "c", "d","e","f","g","h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G","H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",];

const subtractInventory = async (item)=>{
    console.log(item)
    if(item.type != "gift"){
        let inv = await Inventory.findOne({_id: item.inventory.inventory._id? item.inventory.inventory._id: item.inventory.inventory})
        //console.log(inv, "invetory subrtact")
        console.log(inv.quantity)
        inv.quantity = inv.quantity - 1
        console.log( inv.quantity, "qty")
        inv.inStock = inv.inStock ? inv.inStock.filter(i=> i.toString() != item._id.toString()) : []
        inv.attached = inv.attached ? inv.attached.filter(i=> i.toString() != item._id.toString()) : []
        await inv.save()
        //console.log(inv, "invetory subrtact")
    }
}
const checkInventory = async (item)=>{
    if(item.type == "gift") return 100
    let inv = await Inventory.findOne({_id: item.inventory.inventory._id})
    return inv.quantity
}
export const config = {
    api: {
      bodyParser: {
        sizeLimit: '10mb',
      },
    },
  }
export async function POST(req=NextApiRequest){
    let data = await req.json();
    let labelsString = ``
    //create batchId
    let batchID = ''
    for(let i = 0; i< 9; i++)
        batchID += letters[Math.floor(Math.random() * letters.length)]
    // build labels
    let preLabels = []
    let pieceIds = []
    let j = 1
    data.items = data.items.filter(i=> i.labelPrinted == false)
    for(let i of data.items){
        let label = await buildLabelData(i, j, data.poNumber)
        preLabels.push(label)
        pieceIds.push(i.pieceId)
        j++
        await subtractInventory(i)
        
    }
    // full fill promises
    preLabels.map(l=> labelsString += l)
    //create label string
    //convert to base64
    labelsString = btoa(labelsString)
   
    //print labels
    console.log(process.env.localIP, process.env.localKey)
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy`
        }
    }
    console.log(headers)
    let res = await axios.post(`http://${process.env.localIP}/api/print-labels`, {label: labelsString, printer: "printer1"}, headers).catch(e=>{console.log(e.response)})
    console.log(res?.data)
    //update data
    console.log(pieceIds)
    let batch = new Batches({batchID, date: new Date(Date.now()), count: preLabels.length })
    await batch.save()
    await Items.updateMany({pieceId: {$in: pieceIds}}, {labelPrinted: true, $push: {labelPrintedDates: {$each: [new Date(Date.now())]}, steps: {$each: [{status: "label Printed", date: new Date(Date.now())}]}}, batchID})
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    //console.log(giftMessages)
    return NextResponse.json({error: false, labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
}
