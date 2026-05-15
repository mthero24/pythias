import { NextApiRequest, NextResponse } from "next/server";
import { ProductInventory } from "@pythias/mongo";

export async function POST(req = NextApiRequest) {
    let data = await req.json();
    let inventory = await ProductInventory.findById(data.id);
    if(!inventory){
        return NextResponse.json({error: true, message: "Inventory not found"});
    }
    if (data.quantity !== undefined) inventory.quantity = data.quantity;
    if (data.location !== undefined) inventory.location = data.location;
    await inventory.save();
    return NextResponse.json({error: false, message: "Inventory updated successfully", inventory});

}