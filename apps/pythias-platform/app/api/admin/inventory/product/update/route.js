import { NextApiRequest, NextResponse } from "next/server";
import { PlatformProductInventory as ProductInventory } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let data = await req.json();
    let inventory = await ProductInventory.findOne({ _id: data.id, orgId });
    if (!inventory) {
        return NextResponse.json({ error: true, message: "Inventory not found" });
    }
    if (data.quantity !== undefined) inventory.quantity = data.quantity;
    if (data.location !== undefined) inventory.location = data.location;
    await inventory.save();
    return NextResponse.json({ error: false, message: "Inventory updated successfully", inventory });
}
