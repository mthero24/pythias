import { NextApiRequest, NextResponse } from "next/server";
import {getWeight} from "@/functions/getWeight";
const stations = {
    station1: 'http://192.168.1.110:3003/getweight',
    station2: 'http://192.168.1.109:3003/getweight',
    station3: 'http://192.168.1.108:3003/getweight',
    station4: 'http://192.168.1.111:3003/getweight',
    station5: 'http://192.168.1.61:3003/getweight'
}
export async function GET(req = NextApiRequest){
    console.log(req.nextUrl.searchParams.get("station"))
    try{
        let res= await getWeight({url: stations[req.nextUrl.searchParams.get("station")]})
        console.log(res)
        return NextResponse.json({...res})
    }catch(e){
        return NextResponse.json({error: true, msg: e})
    }
}