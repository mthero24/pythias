import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios";
export async function GET(req = NextApiRequest){
    console.log(process.env.localIP)
    let res = await axios.get(`${process.env.localIP}/api/shipping/scales?station=${req.nextUrl.searchParams.get("station")}`)
    console.log(res.data)
    return NextResponse.json({...res.data})
}