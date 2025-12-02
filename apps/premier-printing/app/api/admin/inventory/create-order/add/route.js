import { NextApiRequest, NextResponse } from "next/server"
import { Inventory  } from "@pythias/mongo";

export async function POST(req = NextApiRequest) {
    console.log("hit")
    let data = await req.json()
    console.log(data)
    let inventories = []
    for (let item of data.items) {
        let inventory = await Inventory.findOne({ blank: item.blank._id, color: item.color._id, sizeId: item.size._id })
        inventories.push({ inventory, order: item.quantity })
    }
    return NextResponse.json({inventories})
}