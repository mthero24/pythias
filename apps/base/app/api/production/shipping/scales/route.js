import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios";
export async function GET(req = NextApiRequest){
    //console.log(req.nextUrl.searchParams.get("station"))
    let res = await axios.get(`http://localhost:3006/api/shipping/scales?station=${req.nextUrl.searchParams.get("station")}`)
    return NextResponse.json({...res.data})
}