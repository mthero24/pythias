import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios"
export async function POST(req= NextApiRequest){
    let data = await req.json();
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy`
        }
    }
    let res = await axios.post(`http://${process.env.localIP}/api/shipping/${data.station == "station5"? "cpu": "printers"}`, {label: data.label, station: data.station, barcode: "po"}, headers)
    console.log(res.data)
    if(res.error){
        return NextResponse.json({error: true, msg: "error printing label"})
    }else{
        console.log("return")
        return NextResponse.json({error: false, label: res.label})
    }
}