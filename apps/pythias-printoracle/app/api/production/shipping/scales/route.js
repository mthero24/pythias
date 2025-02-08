import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios";
export async function GET(req = NextApiRequest){
    console.log(process.env.localIP)
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$HN2gb5EVudQkf9op49kKJu3MoQQlPMgN00XUMIoy51EIiHNtbZqNm`
        }
    }
    let res = await axios.get(`http://${process.env.localIP}/api/shipping/scales?station=${req.nextUrl.searchParams.get("station")}`, headers)
    console.log(res.data)
    return NextResponse.json({...res.data})
}