import {NextApiRequest, NextResponse} from "next/server";
import {SkuToUpc} from "@pythias/mongo";

export async function POST(req=NextApiRequest){
    await SkuToUpc.updateMany({temp: true, hold: true}, {$set: {hold: false}}, {new: true});
    return NextResponse.json({error: false, msg: "UPCs Released"})
}