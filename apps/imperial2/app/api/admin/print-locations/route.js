import { NextApiRequest, NextResponse } from "next/server";
import {PrintLocations} from "@pythias/mongo";

export async function POST(req = NextApiRequest) {
    let data = await req.json();
    console.log(data)
    let print = new PrintLocations({name: data.name})
    print = await print.save()
    let printLocations = await PrintLocations.find({})
    return NextResponse.json({location: print, printLocations})
}