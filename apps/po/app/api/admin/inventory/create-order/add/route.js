import { NextApiRequest, NextResponse } from "next/server"
import { Inventory  } from "@pythias/mongo";

export async function POST(req = NextApiRequest) {
    console.log("hit")
    let data = await req.json()
    console.log(data)
    let inventory = await Inventory.findOne({ inventory_id: encodeURIComponent(`${data.color.name}-${data.size.name}-${data.blank.code}`) })
    return NextResponse.json({inventory})
}