import { NextApiRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { LabelsData } from "../../../../../functions/labels";
import Items from "../../../../../models/Items";
import Inventory from "../../../../../models/inventory";
import { logChange, userFromToken } from "@pythias/backend/server";

const pieceLabel = (item) => [item?.styleCode, item?.colorName, item?.sizeName].filter(Boolean).join(" · ") || item?.pieceId || "";
export async function POST(req=NextApiRequest){
    let data = await req.json()
    try{
        const { userName, email } = userFromToken(await getToken({ req }));
        let item = await Items.findOne({ pieceId: data.pieceId });
        let inventory = await Inventory.findOne({
            color_name: item.colorName,
            size_name:  item.sizeName,
            style_code: item.styleCode,
        });
        const before = inventory ? Number(inventory.quantity) || 0 : null;
        if (inventory) {
            inventory.quantity = 0;
            inventory.inStock    = (inventory.inStock    ?? []).filter(id => id.toString() !== item._id.toString());
            inventory.outOfStock = [...(inventory.outOfStock ?? []).filter(id => id.toString() !== item._id.toString()), item._id];
            inventory.markModified("quantity");
            inventory.markModified("inStock");
            inventory.markModified("outOfStock");
            await inventory.save();
        }
        item.stockStatus = null;
        item.labelPrinted = false;
        await item.save();
        if (inventory) logChange({ entityType: "inventory", entityId: inventory._id, entityName: `${pieceLabel(item)} — piece ${item.pieceId}`, action: "return_label_to_queue", before: { quantity: before }, after: { quantity: 0 }, userName, email, provider: "po" });
        const {labels, giftMessages, rePulls, batches} = await LabelsData()
        return NextResponse.json({error: false, labels, giftMessages, rePulls, batches})
    }catch(e){
        return NextResponse.json({error: true, msg: e.message ?? e})
    }
}
export async function PUT(req=NextApiRequest){
    let data = await req.json()
    try{
        const { userName, email } = userFromToken(await getToken({ req }));
        let item = await Items.findOne({ pieceId: data.pieceId });
        let inventory = await Inventory.findOne({
            color_name: item.colorName,
            size_name:  item.sizeName,
            style_code: item.styleCode,
        });
        const before = inventory ? Number(inventory.quantity) || 0 : null;
        if (inventory) {
            // Returning a canceled blank to inventory: the piece becomes available stock. So count up
            // (null-safe — a missing/NaN quantity must not turn into NaN→0) and move the id INTO inStock,
            // OUT of attached/outOfStock/ordered. (Was backwards: it added to attached + removed from inStock.)
            inventory.quantity   = (Number(inventory.quantity) || 0) + 1;
            inventory.inStock    = [...(inventory.inStock    ?? []).filter(id => id.toString() !== item._id.toString()), item._id];
            inventory.attached   = (inventory.attached   ?? []).filter(id => id.toString() !== item._id.toString());
            inventory.outOfStock = (inventory.outOfStock ?? []).filter(id => id.toString() !== item._id.toString());
            inventory.ordered    = (inventory.ordered    ?? []).filter(id => id.toString() !== item._id.toString());
            inventory.markModified("quantity");
            inventory.markModified("attached");
            inventory.markModified("inStock");
            inventory.markModified("outOfStock");
            inventory.markModified("ordered");
            await inventory.save();
        }
        item.stockStatus = "inStock";
        item.labelPrinted = false;
        await item.save();
        if (inventory) logChange({ entityType: "inventory", entityId: inventory._id, entityName: `${pieceLabel(item)} — piece ${item.pieceId}`, action: "return_product_to_inventory", before: { quantity: before }, after: { quantity: inventory.quantity }, userName, email, provider: "po" });
        const {labels, giftMessages, rePulls, batches} = await LabelsData()
        return NextResponse.json({error: false, labels, giftMessages, rePulls, batches})
    }catch(e){
        return NextResponse.json({error: true, msg: e.message ?? e})
    }
}