import { NextApiRequest, NextResponse } from "next/server";
import Items from "@/models/Items";
import Batches from "@/models/batches";
import { LabelsData } from "@/functions/labels";
import btoa from "btoa";
import axios from "axios";
import {buildLabelData} from "@/functions/labelString"
import Inventory from "../../../../models/inventory";
import {createPdf} from "@pythias/labels"
let letters = ["a", "b", "c", "d","e","f","g","h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G","H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",];

const subtractInventory = async (items)=>{
    items.map(async i=>{
        let inv = await Inventory.findOne({_id: i.inventory._id})
        inv.quantity -= 1
        await inv.save()
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
    //create batchId
    let batchID = ''
    for(let i = 0; i< 9; i++)
        batchID += letters[Math.floor(Math.random() * letters.length)]
    // build labels
    await createPdf({items: data.items, buildLabelData, localIP: process.env.localIP, key: "$2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO"})
    subtractInventory(data.items)
    let pieceIds = data.items.map(i=> i.pieceId)
    console.log(pieceIds)
    let batch = new Batches({batchID, date: new Date(Date.now()), count: data.items.length })
    await batch.save()
    await Items.updateMany({pieceId: {$in: pieceIds}}, {labelPrinted: true, $push: {labelPrintedDates: {$each: [new Date(Date.now())]}, steps: {$each: [{status: "label Printed", date: new Date(Date.now())}]}}, batchID})
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    //console.log(giftMessages)
    return NextResponse.json({error: false, labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
}
