import { NextApiRequest, NextResponse } from "next/server";
import { LabelsData } from "../../../../../functions/labels";
import Items from "../../../../../models/Items";
import Inventory from "../../../../../models/inventory";
export async function POST(req=NextApiRequest){
    let data = await req.json()
    try{
        let item = await Items.findOne({
            pieceId: data.pieceId,
          });
    
          console.log(item);
    
          let inventory = await Inventory.findOne({
            color_name: item.colorName,
            size_name: item.sizeName,
            style_code: item.styleCode,
          });
          if (inventory) {
            inventory.quantity = 0;
            inventory.markModified("quantity");
            await inventory.save();
          }
    
          item.labelPrinted = false;
          await item.save();
        const {labels, giftMessages, rePulls, batches} = await LabelsData()
        return NextResponse.json({error: false, labels, giftMessages, rePulls, batches})
    }catch(e){
        return NextResponse.json({error: true, msg: e})
    }
}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    try{
        let item = await Items.findOne({
            pieceId: data.pieceId,
        });

        console.log(item);

        let inventory = await Inventory.findOne({
            color_name: item.colorName,
            size_name: item.sizeName,
            style_code: item.styleCode,
        });
        console.log(inventory)
        if (inventory) {
            inventory.quantity += 1;
            inventory.markModified("quantity");
            await inventory.save();
        }
        item.labelPrinted = false;
        await item.save();
        const {labels, giftMessages, rePulls, batches} = await LabelsData()
        return NextResponse.json({error: false, labels, giftMessages, rePulls, batches})
    }catch(e){
        return NextResponse.json({error: true, msg: e})
    }
}