import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios"
export async function POST(req= NextApiRequest){
    let data = await req.json();
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$HN2gb5EVudQkf9op49kKJu3MoQQlPMgN00XUMIoy51EIiHNtbZqNm`
        }
    }
    let res = await axios.post(`${process.env.localIP}/api/shipping/printers`, {label: data.label, station: data.station}, headers)
    console.log(res.data)
    if(res.error){
        return NextResponse.json({error: true, msg: "error printing label"})
    }else{
        console.log("retrun")
        return NextResponse.json({error: false, label: res.label})
    }
}