import { NextApiRequest, NextResponse } from "next/server";
import { Items, ReturnBins, Batches } from "@pythias/mongo";
import { LabelsData } from "@/functions/labels";
import btoa from "btoa";
import axios from "axios";
import { buildLabelData, loadTemplate } from "@/functions/labelString"
import { Types } from "mongoose";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";
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
    try {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);
        let data = await req.json();
        const printerName = data.printer ?? "printer1";
        let labelsString = ``
        //create batchId
        let batchID = ''
        for(let i = 0; i< 9; i++)
            batchID += letters[Math.floor(Math.random() * letters.length)]
        // batch order-item counts in one aggregation instead of one query per item
        const printableItems = data.items.filter(i => !i.labelPrinted);
        const uniqueOrderIds = [...new Set(printableItems.filter(i => i.order).map(i => (i.order._id || i.order).toString()))];
        const countAgg = uniqueOrderIds.length
            ? await Items.aggregate([
                { $match: { order: { $in: uniqueOrderIds.map(id => new Types.ObjectId(id)) }, canceled: false } },
                { $group: { _id: "$order", count: { $sum: 1 } } }
              ])
            : [];
        const orderCountMap = Object.fromEntries(countAgg.map(r => [r._id.toString(), r.count]));

        // build labels
        const [sc, template] = await Promise.all([getShippingCreds(), loadTemplate()]);
        let preLabels = [];
        let j = 0
        let pieceIds = []
        console.log(printableItems.length)
        for(let i of printableItems){
            const totalQuantity = orderCountMap[(i.order?._id || i.order)?.toString()] ?? null;
            let label = await buildLabelData(i, j, data.poNumber, {}, totalQuantity, template)
            pieceIds.push(i.pieceId)
            preLabels.push(label)
            j++
        }
        console.log(preLabels.length)
        preLabels.map(l=> labelsString += l)
        // btoa fails on non-Latin1 characters — sanitise first
        labelsString = btoa(unescape(encodeURIComponent(labelsString)))
        const headers = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sc.localKey}`
            }
        };
        const printEndpoint = template.format === "PDF" ? "print-labels-pdf" : "print-labels";
        let res = await axios.post(`http://${sc.localIP}/api/${printEndpoint}`, {label: labelsString, printer: printerName}, headers).catch(e=>{console.log(e.response)})
        let batch = new Batches({batchID, date: new Date(Date.now()), count: preLabels.length })
        await batch.save()
        await Items.updateMany({pieceId: {$in: pieceIds}}, {labelPrinted: true, stockStatus: null, $push: {labelPrintedDates: {$each: [new Date(Date.now())]}, steps: {$each: [{status: "label Printed", date: new Date(Date.now())}]}}, batchID})
        logActivity({ action: "label_print", entity: "order", count: pieceIds.length, userName, email });
        const {labels, giftMessages, rePulls, batches} = await LabelsData()
        return NextResponse.json({error: false, labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
    } catch(e) {
        console.error("[print-labels] 500:", e);
        return NextResponse.json({ error: true, msg: e.message ?? e.toString() });
    }
}
