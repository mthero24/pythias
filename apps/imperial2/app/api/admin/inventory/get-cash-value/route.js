import Inventory from "@/models/inventory";
import {NextApiRequest, NextResponse} from "next/server";

export async function GET(){
    let inventory = await Inventory.find({quantity: {$gt:0}}).select('unit_cost quantity').lean();

    let total = 0;
    console.log(inventory[0])

    for(let item of inventory){
        total += item.quantity * item.unit_cost;
    }   

    console.log(total)

    return NextResponse.json({error: false, total});
}