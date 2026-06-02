import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios";
import { getShippingCreds } from "@/lib/getShippingCreds";
export async function POST(req= NextApiRequest){
    let data = await req.json();
    const sc = await getShippingCreds();
    const stationCfg = sc.stations.find(s => s.name === data.station);
    const endpoint = (stationCfg?.format ?? "ZPL") === "PDF" ? "cpu" : "printers";
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sc.localKey}`
        }
    }
    let res = await axios.post(`http://${sc.localIP}/api/shipping/${endpoint}`, {label: data.label, station: data.station, barcode: "po"}, headers)
    console.log(res.data)
    if(res.error){
        return NextResponse.json({error: true, msg: "error printing label"})
    }else{
        console.log("return")
        return NextResponse.json({error: false, label: res.label})
    }
}