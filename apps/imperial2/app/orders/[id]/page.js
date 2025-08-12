import { serialize } from "@/functions/serialize";
import {Order, Blank }from "@pythias/mongo";
import {Main} from "./Main";
import Blanks from "@/app/admin/blanks/page";
import { notFound } from "next/navigation";

export default async function OrderPage(req){
    console.log(await req.params)
    let params = await req.params;
    let order = await Order.findOne({_id: params.id}).populate("items").lean();
    let blanks = await Blank.find({}).populate("colors").lean();
    console.log(order);
    if(!order) return notFound()
    order = serialize(order);
    blanks = serialize(blanks);
    return <Main ord={order} blanks={blanks}/>
}