import { NextApiRequest, NextResponse } from "next/server";
import { LabelsData } from "../../../../../functions/labels";
import { Items, Inventory } from "@pythias/mongo";
export async function POST(req=NextApiRequest){
    let data = await req.json()
    try{
        let item = await Items.findOne({ pieceId: data.pieceId });
        let inventory = await Inventory.findOne({
            color_name: item.colorName,
            size_name:  item.sizeName,
            style_code: item.styleCode,
        });
        if (inventory) {
            inventory.quantity = 0;
            inventory.inStock  = (inventory.inStock  ?? []).filter(id => id.toString() !== item._id.toString());
            inventory.attached = [...(inventory.attached ?? []).filter(id => id.toString() !== item._id.toString()), item._id.toString()];
            inventory.markModified("quantity");
            inventory.markModified("inStock");
            inventory.markModified("attached");
            await inventory.save();
        }
        item.stockStatus = "attached";
        item.labelPrinted = false;
        item.steps.push({ status: "Out of Stock", date: new Date() });
        await item.save();
        const {labels, giftMessages, rePulls, batches} = await LabelsData()
        return NextResponse.json({error: false, labels, giftMessages, rePulls, batches})
    }catch(e){
        return NextResponse.json({error: true, msg: e.message ?? e})
    }
}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    try{
        let item = await Items.findOne({ pieceId: data.pieceId });
        let inventory = await Inventory.findOne({
            color_name: item.colorName,
            size_name:  item.sizeName,
            style_code: item.styleCode,
        });
        if (inventory) {
            inventory.quantity  += 1;
            inventory.inStock  = [...(inventory.inStock  ?? []).filter(id => id.toString() !== item._id.toString()), item._id.toString()];
            inventory.attached = (inventory.attached ?? []).filter(id => id.toString() !== item._id.toString());
            inventory.markModified("quantity");
            inventory.markModified("inStock");
            inventory.markModified("attached");
            await inventory.save();
        }
        item.stockStatus = "inStock";
        item.labelPrinted = false;
        item.steps.push({ status: "returned to inventory", date: new Date() });
        await item.save();
        const {labels, giftMessages, rePulls, batches} = await LabelsData()
        return NextResponse.json({error: false, labels, giftMessages, rePulls, batches})
    }catch(e){
        return NextResponse.json({error: true, msg: e.message ?? e})
    }
}