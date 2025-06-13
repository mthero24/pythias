import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios";
export async function GET(req = NextApiRequest){
    console.log(process.env.localIP)
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$C60NVSh5FFWXoUlY1Awaxu2jKU3saE/aqkYqF3iPIQVJl/4Wg.NTO`
        }
    }
    let res = await axios.get(`http://${process.env.localIP}/api/shipping/scales?station=${req.nextUrl.searchParams.get("station")}`, headers)
    console.log(res.data)
    if(res.data && res.data.value){
        res.data.value = res.data.value - (res.data.value * .1)
    }
    // res.data.error = false
    // res.data.value = 10
    console.log(res.data)
    return NextResponse.json({...res.data})
}