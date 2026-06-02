import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios";
import { getShippingCreds } from "@/lib/getShippingCreds";
export async function GET(req = NextApiRequest){
    const sc = await getShippingCreds();
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sc.localKey}`
        }
    }
    let res = await axios.get(`http://${sc.localIP}/api/shipping/scales?station=${req.nextUrl.searchParams.get("station")}`, headers)
    console.log(res.data)
    return NextResponse.json({...res.data})
}