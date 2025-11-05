import Style from "@/models/StyleV2";
import { NextApiRequest, NextResponse } from "next/server"

export async function GET(req = NextApiRequest) {
    let blanks = await Style.find({}).populate("colors").populate("sizes")
    return NextResponse.json({blanks})
}