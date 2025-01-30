import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios"
export async function POST(req= NextApiRequest){
    let data = await req.json()
    let resData
    let res = await axios.post(`http://localhost:3500/roq`, {...data}).catch(e=>{resData = e.response?.data})
    if(res) return NextResponse.json(res?.data);
    else if(resData) return NextResponse.json(resData);
    else return NextResponse.json({error: true, msg: "Could not reach file writer!"});
}