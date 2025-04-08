import Inventory from "@/models/inventory";
import Blanks from "@/models/StyleV2";
import {NextApiRequest, NextResponse} from "next/server";
export async function GET(req){
    let page = req.nextUrl.searchParams.get("page") ? Number(req.nextUrl.searchParams.get("page")) - 1 : 0;
        if(page < 0){
            page = 0;
        }
        let options = {};
        let sort = {_id: -1};
        if(req.nextUrl.searchParams.get("style")){
            options['inventory_id'] = {$regex: new RegExp("-" + req.nextUrl.searchParams.get("style"), 'gi')}
        }
        if(req.nextUrl.searchParams.get("size")){
            options['size_name'] = {$regex: new RegExp(req.nextUrl.searchParams.get("size"), 'gi')}
        }
        if(req.nextUrl.searchParams.get("color")){
            options['color_name'] = {$regex: new RegExp(req.nextUrl.searchParams.get("color"), 'gi')}
        }
        if(req.nextUrl.searchParams.get("sort")){
            sort = JSON.parse(req.nextUrl.searchParams.get("sort"));
            console.log(sort)
        }
        if(req.nextUrl.searchParams.get("pendingOrders") && req.nextUrl.searchParams.get("pendingOrders") == 'true'){
            options = {
                $and: [
                    { pending_orders: { $gt: 0 } },
                    {
                      $expr: {
                        $gt: [
                          '$pending_orders',
                          { $add: ['$pending_quantity', '$quantity'] }
                        ]
                      }
                    }
                  ]
            };
            let inventory = await Inventory.find(options).skip(page * 400).sort({style_code: 1}).limit(400).lean();
            return NextResponse.json(inventory)
        }
        let inventory = await Inventory.find(options).skip(page * 400).sort({style_code: 1}).limit(400).lean();
        return NextResponse.json(inventory)
}
export async function POST(req=NextApiRequest){
    let data = await req.json()
    //console.log(data)
    let inventory = await Inventory.findOne({inventory_id: data.inventory_id});
    inventory.quantity = Number(data.quantity);
    inventory.unit_cost = Number(data.cost);
    inventory.row = data.aisle
    inventory.unit = data.unit
    inventory.shelf = data.shelf
    inventory.bin = data.bin
    await inventory.save();
    return NextResponse.json({error: false})
}
export async function PUT(req=NextApiRequest){
    console.log("here")
    let data = await req.json()
    let inventory = await Inventory.findOneAndDelete({inventory_id: data.inventory_id});
    return NextResponse.json({error: false})
}