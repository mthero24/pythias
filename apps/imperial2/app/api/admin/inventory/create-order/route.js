import { NextApiRequest, NextResponse } from "next/server"
import { Blank as Blanks, Item as Items, Inventory, InventoryOrders } from "@pythias/mongo";

export async function GET() {
    console.log("Fetching inventory for orders");
    let inventory = await Inventory.find({
        $or: [ {
            $expr: {
                $lte: ["$quantity", "$order_at_quantity"]
            }
}] }).populate("color").select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin attached sizeId skus orders inStock").lean()
    console.log(inventory.length, "inventory items found for orders");
    let blankCodes = [...new Set(inventory.map(i => i.style_code))];
    let blanks = await Blanks.find({ code: { $in: blankCodes } }).populate("colors").select("code name colors sizes department").collation({ locale: "en", strength: 2 }).lean();
    let found = [];
    if (blanks) {
        let combined = []
        for (let blank of blanks) {
            blank.inventory = inventory.filter(i => i.style_code == blank.code)
            combined.push({ blank, inventories: blank.inventory })
        }
        found = [...combined]
    }
    return NextResponse.json({ error: false, blanks: found })
}