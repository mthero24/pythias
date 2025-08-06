import Order from "@/models/Order";
import Items from "@/models/Items"
import {NextApiRequest, NextResponse} from "next/server";
import {OrdersSearch} from "@/functions/ordersSearch"

export async function POST(req=NextApiRequest){
    let data = await req.json()
    let orders
    let items = await Items.find({pieceId: {$regex: data.search, $options: "si"}})
    if(items.length > 0){
        orders = items.map(i=> i.order)
        orders = await Order.find({_id: {$in: orders}}).populate("items")
    }else{
        orders = await Order.find({poNumber: {$regex: data.search, $options: "si"}}).populate("items")
        if(orders.length == 0 && data.search.length > 3){
            orders = await OrdersSearch({q: data.search,  productsPerPage: 200, page: 1})
            orders = orders.map(o=> {return o._id})
            orders = await Order.find({_id: {$in: orders}}).populate("items")
        }
    }
    return NextResponse.json({error: false, orders})
}