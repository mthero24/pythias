import { pullOrders } from "@/functions/pullOrders"
import {Inventory, InventoryOrders, Products} from "@pythias/mongo"
import axios from "axios";
export default async function Test(){

    // let prods = await Products.find({})

    // for(let p of prods){
    //     for(let v of p.variantsArray){
    //         v.inventory = await Inventory.findOne({ blank: v.blank, color: v.color, sizeId: v.size });
    //     }
    //     p.markModified("variantsArray");
    //     await p.save();
    // }

    return <h1>test</h1>
}