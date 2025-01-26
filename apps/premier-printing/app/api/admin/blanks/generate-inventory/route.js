import { generateInventory } from "@/functions/generateInventory";
import Blanks from "@/modals/Blanks";
import { NextApiRequest, NextResponse } from "next/server";

export async function POST(req= NextApiRequest){
    let data = await req.json();
    let style = await Blanks.findOne({ _id: data.id });
    await generateInventory(style);
    return NextResponse.json({ style });
}