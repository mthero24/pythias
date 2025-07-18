import {NextApiRequest, NextResponse} from "next/server";
import {Temps} from "@pythias/mongo";


export async function POST(req=NextApiRequest){
    let data = await req.json()
    let temp = await Temps.findOneAndUpdate({_id:data._id}, data)
    if(!temp){
        temp = new Temps(data)
        await temp.save()
    }
    return NextResponse.json({error: false, msg: "updated"})
}