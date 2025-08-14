import { NextApiRequest, NextResponse } from "next/server";
import axios from "axios";
import Order from "@/models/Order"
export async function GET(req = NextApiRequest){
    console.log(process.env.localIP)
    let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy`
        }
    }
    let res = await axios.get(`http://${process.env.localIP}/api/shipping/scales?station=${req.nextUrl.searchParams.get("station")}`, headers)
    console.log(res.data)
    // res.data.error = false
    // res.data.value = 8
    return NextResponse.json({...res.data})
    // let data = {error: false, value: 0}
    // let order = await Order.findById(req.nextUrl.searchParams.get("id")).populate({path: "items", populate: "styleV2"})
    // for(let i of order.items){
    //     data.value = data.value + (i.styleV2.sizes.filter(s=> s._id.toString() == i.size.toString() || s.name == i.sizeName)[0]?.weight? i.styleV2.sizes.filter(s=> s._id.toString() == i.size.toString() || s.name == i.sizeName)[0]?.weight : 3)
    // }
    // console.log(data)
    // return NextResponse.json({...data})
}