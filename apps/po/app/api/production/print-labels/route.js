import { NextApiRequest, NextResponse } from "next/server";
import Items from "../../../../models/Items";
import Batches from "../../../../models/batches";
import { LabelsData } from "../../../../functions/labels";
import btoa from "btoa";
import axios from "axios";
import {buildLabelData} from "../../../../functions/labelString"
import { Inventory } from "@pythias/mongo";
import inventory from "@/models/inventory";
import { Types } from "mongoose";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";
let letters = ["a", "b", "c", "d","e","f","g","h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G","H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",];

const subtractInventory = async (item) => {
    if (item.type === "gift" || item.styleCode === "BUMP") return;
    if (!item.inventory?.inventory) return;
    try {
        const invId = item.inventory.inventory._id ?? item.inventory.inventory;
        const inv = await Inventory.findOne({ _id: invId });
        if (inv) {
            inv.quantity = inv.quantity - 1;
            inv.inStock  = inv.inStock  ? inv.inStock.filter(i  => i.toString() !== item._id.toString()) : [];
            inv.attached = inv.attached ? inv.attached.filter(i => i.toString() !== item._id.toString()) : [];
            await inv.save();
        }
    } catch (e) {
        console.log(e);
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
    // build labels
    data.items = data.items.filter(i=> i.labelPrinted == false)

    // batch order-item counts in one aggregation instead of one query per item
    const uniqueOrderIds = [...new Set(data.items.filter(i => i.order).map(i => (i.order._id || i.order).toString()))];
    const countAgg = uniqueOrderIds.length
        ? await Items.aggregate([
            { $match: { order: { $in: uniqueOrderIds.map(id => new Types.ObjectId(id)) }, canceled: false } },
            { $group: { _id: "$order", count: { $sum: 1 } } }
          ])
        : [];
    const orderCountMap = Object.fromEntries(countAgg.map(r => [r._id.toString(), r.count]));

    let preLabels = []
    let pieceIds = []
    let j = 1
    for(let i of data.items){
        const totalQuantity = orderCountMap[(i.order?._id || i.order)?.toString()] ?? null;
        let label = await buildLabelData(i, j, data.poNumber, {}, totalQuantity)
        preLabels.push(label)
        pieceIds.push(i.pieceId)
        j++
    }
    for(let item of data.items){
        await subtractInventory(item)
    };
    // full fill promises
    preLabels.map(l=> labelsString += l)
    //create label string
    //convert to base64
    labelsString = btoa(labelsString)
   
    const sc = await getShippingCreds();
    const headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sc.localKey}`
        }
    };
    let res = await axios.post(`http://${sc.localIP}/api/print-labels`, {label: labelsString, printer: printerName}, headers).catch(e=>{console.log(e.response)})
    console.log(res?.data)
    //update data
    console.log(pieceIds)
    let batch = new Batches({batchID, date: new Date(Date.now()), count: preLabels.length })
    await batch.save()
    await Items.updateMany({pieceId: {$in: pieceIds}}, {labelPrinted: true, $push: {labelPrintedDates: {$each: [new Date(Date.now())]}, steps: {$each: [{status: "label Printed", date: new Date(Date.now())}]}}, batchID})
    logActivity({ action: "label_print", entity: "order", count: pieceIds.length, userName, email, provider: "po" });
    const {labels, giftMessages, rePulls, batches} = await LabelsData()
    //console.log(giftMessages)
    return NextResponse.json({error: false, labels, giftMessages: giftMessages? giftMessages: [], rePulls, batches})
  } catch(e) {
    console.error("[po/print-labels] 500:", e);
    return NextResponse.json({ error: true, msg: e.message ?? e.toString() });
  }
}
