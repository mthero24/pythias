import { NextApiRequest, NextResponse } from "next/server";
import {Order} from "@pythias/mongo";
import axios from "axios";
export async function GET(req = NextApiRequest){
    // console.log(req.nextUrl.searchParams.get("station"), req.nextUrl.searchParams.get("id"))
    // let headers = {
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Authorization": `Bearer $2a$10$Z7IGcOqlki/aMY.SxBz6/.vj3toNJ39/TGh0YunAAUHh3dkWy1ZUW`
    //     }
    // }
    // let res = await axios.get(`http://${process.env.localIP}/api/shipping/scales?station=${req.nextUrl.searchParams.get("station")}`, headers)
    // console.log(res.data)
    // console.log(res.data.error, "res error", req.nextUrl.searchParams.get("id"), res.data.error && req.nextUrl.searchParams.get("id"))
    // if (res.data.error && req.nextUrl.searchParams.get("id")){
        try{
            console.log("getting weight for order")
            let order = await Order.findById(req.nextUrl.searchParams.get("id")).populate({path: "items", populate: "blank"})
            let weight = 0
            for(let i of order.items){
                weight += i.blank.sizes.find(s => s._id.toString() == i.size.toString()).weight || 8
            }
            return NextResponse.json({ error: false, value: weight })
        }catch(e){
            console.log(e)
            return NextResponse.json({ error: true, message: e.message })
        }
    // }else{
    //     return NextResponse.json({...res.data})
    // }
}