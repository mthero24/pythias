import { NextApiRequest, NextResponse } from "next/server";
import Items from "@/models/Items";
import ReturnBins from "@/models/returnBins"
import Batches from "@/models/batches";
import { LabelsData } from "@/functions/labels";
import btoa from "btoa";
import axios from "axios";
import {buildLabelData} from "@/functions/labelString"
import Inventory from "../../../../models/inventory";
let letters = ["a", "b", "c", "d","e","f","g","h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G","H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",];
let updateReturnBin = async (re, upc, sku)=>{
  try{
    let hasReturn = await ReturnBins.findOne({_id: re._id})
    let newInv = []
    for(let i of hasReturn.inventory){
      if(i.upc == upc || i.sku == sku){
        i.quantity -= 1
      }
      
    }
    hasReturn.inventory = newInv
    hasReturn.markModified("inventory")
    await hasReturn.save()
  }catch(e){
    console.log(e)
  }
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
    let preLabels = [];
    let j = 0
    let pieceIds = []
    console.log(data.items.length)
    for(let i of data.items){
      if(!i.labelPrinted){
        let label = await buildLabelData(i, j)
        pieceIds.push(i.pieceId)
        preLabels.push(label)
      }
    }
    console.log(preLabels.length)
    preLabels.map(l=> labelsString += l)
    console.log(preLabels)
    labelsString = btoa(labelsString)
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$Z7IGcOqlki/aMY.SxBz6/.vj3toNJ39/TGh0YunAAUHh3dkWy1ZUW`
        }
    }
    let res = await axios.post(`http://${process.env.localIP}/api/print-labels`, {label: labelsString, printer: "printer1"}, headers).catch(e=>{console.log(e.response)})
    let batch = new Batches({batchID, date: new Date(Date.now()), count: preLabels.length })
    await batch.save()
    await Items.updateMany({pieceId: {$in: pieceIds}}, {labelPrinted: true, $push: {labelPrintedDates: {$each: [new Date(Date.now())]}, steps: {$each: [{status: "label Printed", date: new Date(Date.now())}]}}, batchID})
    await Items.updateMany({pieceId: {$in: returnPieceIds}}, {labelPrinted: true, pulledFromReturn: true, $push: {labelPrintedDates: {$each: [new Date(Date.now())]}, steps: {$each: [{status: "label Printed", date: new Date(Date.now())}]}}, batchID})
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    //console.log(giftMessages)
    return NextResponse.json({error: false, labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
}
