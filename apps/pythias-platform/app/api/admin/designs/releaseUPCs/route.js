import {NextApiRequest, NextResponse} from "next/server";
import {SkuToUpc} from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function POST(req=NextApiRequest){
    const token = await getToken({ req });
    if(!token?.permissions?.designs){
        return NextResponse.json({error: true, msg: "You do not have permission to release UPCs."}, {status: 403})
    }
    await SkuToUpc.updateMany({temp: true, hold: true}, {$set: {hold: false}}, {new: true});
    return NextResponse.json({error: false, msg: "UPCs Released"})
}