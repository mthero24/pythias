import { NextApiRequest, NextResponse } from "next/server";
import { Items, Batches, Inventory, ReturnBins } from "@pythias/mongo";
import { LabelsData } from "@/functions/labels";
import {buildLabelData} from "@/functions/labelString"
import {createPdf} from "@pythias/labels"
let letters = ["a", "b", "c", "d","e","f","g","h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G","H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",];
let updateReturnBin = async (re, upc, sku)=>{
  try{
    let hasReturn = await ReturnBins.findOne({_id: re._id})
    let newInv = []
    for(let i of hasReturn.inventory){
      if(i.upc == upc || i.sku == sku){
        i.quantity -= 1
      }
      if(i.quantity > 0){
        newInv.push(i)
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
    //create batchId
    let batchID = ''
    for(let i = 0; i< 9; i++){
      batchID += letters[Math.floor(Math.random() * letters.length)]
    }
    let itemsToPrint = []
    let itemsToPull = []
    for(let i of data.items){
      let hasReturn= await ReturnBins.findOne({$or: [{"inventory.upc": i.upc}, {"inventory.sku": i.sku}], "inventory.quantity": {$gt: 0}})
      let inv = hasReturn?.inventory.filter(i=> i.sku == i.sku)[0]
      if(inv && inv.quantity > 0){
        updateReturnBin(hasReturn, i.upc, i.sku)
        let item = await Items.findOne({_id: i._id})
        item.pulledFromReturn =true
        item.returnBinNumber = hasReturn.returnBinNumber
        await item.save()
        i.pulledFromReturn = true
        i.returnBinNumber = hasReturn.returnBinNumber
        itemsToPull.push(i)
      }else{
        let inventory = await Inventory.findOne({color_name: i.colorName, size_name: i.sizeName, style_code: i.styleCode})
        if(inventory && inventory.quantity > 0){
          inventory.quantity =
          inventory.quantity - 1
          await inventory.save()
          itemsToPrint.push(i)
        }
      }
    }
    itemsToPrint = itemsToPull.concat(itemsToPrint)
    // build labels
    console.log("items to print", itemsToPrint.length)
    await createPdf({items: itemsToPrint, buildLabelData, localIP: process.env.localIP, key: "$2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO"})
   //subtractInventory(data.items)
    let pieceIds = itemsToPrint.map(i=> i.pieceId)
    // console.log(pieceIds)
    let batch = new Batches({batchID, date: new Date(Date.now()), count:itemsToPrint.length })
    await batch.save()
   await Items.updateMany({pieceId: {$in: pieceIds}}, {labelPrinted: true, $push: {labelPrintedDates: {$each: [new Date(Date.now())]}, steps: {$each: [{status: "label Printed", date: new Date(Date.now())}]}}, batchID})
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    //console.log(giftMessages)
    return NextResponse.json({error: false, labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
}
