import { generateUPC } from "@/functions/generateUpcs";
import { NextResponse } from "next/server";
export async function POST(){
    generateUPC()
    return NextResponse.json({error: false})
}