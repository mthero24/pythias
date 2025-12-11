import { NextApiRequest, NextResponse } from "next/server"
import { Inventory  } from "@pythias/mongo";

export async function POST(req = NextApiRequest) {
    let data = await req.json()
    console.log(data)
    let inventory = await Inventory.findOne({ blank: data.blank._id, color: data.color._id, sizeId: data.size._id })
    return NextResponse.json({inventory})
}