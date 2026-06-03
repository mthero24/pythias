import { NextApiRequest, NextResponse } from "next/server"
import { PlatformInventory as Inventory } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let data = await req.json()
    let inventories = []
    for (let item of data.items) {
        let inventory = await Inventory.findOne({ orgId, blank: item.blank._id, color: item.color._id, sizeId: item.size._id })
        inventories.push({ inventory, order: item.quantity })
    }
    return NextResponse.json({ inventories })
}
