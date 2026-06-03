import { NextApiRequest, NextResponse } from "next/server";
import {PrintTypes} from "@pythias/mongo";

export async function POST(req = NextApiRequest) {
    let data = await req.json();
    console.log(data)
    let print = await PrintTypes.findOne({_id: data.typeId})
    print.price = data.price;
    print = await print.save()
    let printTypes = await PrintTypes.find({})
    return NextResponse.json({type: print, printTypes})
}