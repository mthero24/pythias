import { NextApiRequest, NextResponse } from "next/server";
import {SkuToUpc as UpcToSku} from "@pythias/mongo";

export async function POST(req=NextApiRequest){
    console.log("Releasing hold on UPCs")
    let data = await req.json()
    await UpcToSku.updateMany({ _id: { $in: data.upcs.map(u => u._id) } }, { $set: { hold: false } })
    console.log("Hold released on UPCs")
    return NextResponse.json({error: false})
}