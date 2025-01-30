import { NextApiRequest, NextResponse } from "next/server";
import {print} from "@pythias/shipping"
let printers = {
    station1: "http://192.168.1.94:631/ipp/port1",
    station2: "http://192.168.1.113:631/ipp/port1",
    station3: "http://192.168.1.114:631/ipp/port1",
    station4: "http://192.168.1.254:631/ipp/port1",
    station5: "http://192.168.1.13:631/ipp/port1",
};
export async function POST(req= NextApiRequest){
    let data = await req.json()
    console.log(data.type, "type route")
    let res = await print({label: data.label, printer: printers[data.station], type: data.type})
    console.log(res, "route")
    return NextResponse.json(res)
}   