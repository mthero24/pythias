import Inventory from "@/models/inventory";
import Items from "@/models/Items";
import {NextApiRequest, NextResponse} from "next/server";

export async function POST(req=NextApiRequest){
    let items = await Items.find({
        labelPrinted: false,
        paid: true,
        canceled: false,
        type: { $nin: ["sublimation", "gift"] },
      })
        .populate("order", "poNumber")
        .populate("color styleV2")
        .select("color sizeName styleV2")
        .lean();
  
    items = items.filter((i) => i.color && i.sizeName && i.blank);
    items = items.filter((i) => i.order && i.order.poNumber);
  
    let inventory_ids = items.map((i) =>
        encodeURIComponent(`${i.color.name}-${i.sizeName}-${i.blank.code}`)
    );
    console.log(inventory_ids, "ids");
    let inventory_items = {};
    for (let id of inventory_ids) {
        if (inventory_items[id]) {
          inventory_items[id]++;
        } else {
          inventory_items[id] = 1;
        }
    }
  
    console.log(inventory_items["black-L-AT"]);
  
    let inventory = await Inventory.find().select(
        "pending_orders inventory_id"
    );
    for (let inv of inventory) {
        let og_pending = inv.pending_orders;
        inv.pending_orders = 0;
        if (inventory_items[inv.inventory_id]) {
          inv.pending_orders = inventory_items[inv.inventory_id];
        }
        if (inv.pending_orders != og_pending) {
          console.log("updating", inv.inventory_id);
          inv.save();
        }
    }
    return NextResponse.json({error: false});
}