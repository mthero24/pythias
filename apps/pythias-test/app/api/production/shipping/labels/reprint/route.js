import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios"
import { getShippingCreds } from "@/lib/getShippingCreds";
export async function POST(req= NextApiRequest){
    const sc = await getShippingCreds();
    let data = await req.json();
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sc.localKey}`
        }
    }
    let res = await axios.post(`http://${sc.localIP}/api/shipping/printers`, {label: data.label, station: data.station}, headers)
    console.log(res.data)
    if(res.error){
        return NextResponse.json({error: true, msg: "error printing label"})
    }else{
        console.log("retrun")
        return NextResponse.json({error: false, label: res.label})
    }
}