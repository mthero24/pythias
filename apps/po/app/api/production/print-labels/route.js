import { NextApiRequest, NextResponse } from "next/server";
import Items from "../../../../models/Items";
import Batches from "../../../../models/batches";
import { LabelsData } from "../../../../functions/labels";
import btoa from "btoa";
import axios from "axios";
import {buildLabelData} from "../../../../functions/labelString"
import Inventory from "../../../../models/inventory";
let letters = ["a", "b", "c", "d","e","f","g","h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G","H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",];

const subtractInventory = async (items)=>{
    items.map(async i=>{
        let inv = await Inventory.findOne({_id: i.inventory._id})
        //console.log(inv, "invetory subrtact")
        inv.quantity -= 1
        await inv.save()
        //console.log(inv, "invetory subrtact")
    })
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
    let preLabels = data.items.map(async (i, j)=>{
            let label = await buildLabelData(i, j)
            //console.log(label)
            return label
    })
    // full fill promises
    preLabels = await Promise.all(preLabels);
    preLabels.map(l=> labelsString += l)
    console.log(preLabels.length, "+++++++" ,preLabels)
    //create label string
    console.log(labelsString)
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
    subtractInventory(data.items)
    let pieceIds = data.items.map(i=> i.pieceId)
    console.log(pieceIds)
    let batch = new Batches({batchID, date: new Date(Date.now()), count: preLabels.length })
    await batch.save()
    await Items.updateMany({pieceId: {$in: pieceIds}}, {labelPrinted: true, $push: {labelPrintedDates: {$each: [new Date(Date.now())]}, steps: {$each: [{status: "label Printed", date: new Date(Date.now())}]}}, batchID})
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    //console.log(giftMessages)
    return NextResponse.json({error: false, labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
}
