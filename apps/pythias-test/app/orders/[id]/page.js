import { serialize } from "@/functions/serialize";
import Order from "@/models/Order";
import Blank from "@/models/Blanks"
import {Main} from "./Main";
import Blanks from "@/app/admin/blanks/page";

export default async function OrderPage(req){
   // console.log(await req.params)
    let params = await req.params;
    let order = await Order.findOne({_id: params.id}).populate("items").lean();
    let blanks = await Blank.find({}).populate("colors").lean();
    //console.log(blanks[0]);
    
    order = serialize(order);
    blanks = serialize(blanks);
    return <Main ord={order} blanks={blanks}/>
}