import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios";
//import settings from "../../settings.json"
export async function POST(req = NextApiRequest) {
    let data = await req.json()
    let resData
    console.log(data)
    let res = await axios.post(`http://localhost:3500/`, {...data}).catch(e=>{resData = e.response.data})
    if(res) return NextResponse.json(res?.data);
    else return NextResponse.json(resData);
}