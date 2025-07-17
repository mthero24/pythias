import { generateInventory } from "@/functions/generateInventory";
import {Blank} from "@pythias/mongo";
import { NextApiRequest, NextResponse } from "next/server";

export async function POST(req= NextApiRequest){
    let data = await req.json();
    let style = await Blank.findOne({ _id: data.id });
    await generateInventory(style);
    return NextResponse.json({ style });
}