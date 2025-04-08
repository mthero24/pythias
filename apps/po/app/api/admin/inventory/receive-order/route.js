import Inventory from "@/models/inventory";
import Item from "@/models/Items";
import StyleV2 from "@/models/StyleV2";
import InventoryOrders from "@/models/InventoryOrders";
import {NextApiRequest, NextResponse} from "next/server";

export async function POST(req=NextApiRequest){
    let data = await req.json();
    let printOut = [];
    let unprintedItems = await Item.find({
      labelPrinted: false,
      canceled: false,
      shipped: false,
      paid: true,
      type: { $ne: "gift" },
    });
    // console.log(unprintedItems.map((i) => i.pieceId));
    unprintedItems = unprintedItems.filter(
      (i) => i.color && i.sizeName && i.styleV2
    );

    let order = await InventoryOrders.findOne({
      name: data.name,
      vendor: data.vendor,
      received: { $ne: true },
    }).sort({ _id: -1 });
    let styles = await StyleV2.find().lean().select("_id code");
    if (order) {
        let inventory_items = await Inventory.find({
            _id: { $in: order.items.map((i) => i.inventory.toString()) },
        });
        for (let item of order.items) {
            let inventory_item = inventory_items.filter(
            (i) => i._id.toString() == item.inventory.toString()
            )[0];
            if (inventory_item) {
            inventory_item.pending_quantity -= item.quantity;
            if (inventory_item.pending_quantity < 0) {
                inventory_item.pending_quantity = 0;
            }
            inventory_item.quantity += item.quantity;
            await inventory_item.save();
            console.log(inventory_item.quantity);
            let style = styles.filter(
                (s) =>
                s.code ==
                inventory_item.inventory_id.split("-")[
                    inventory_item.inventory_id.split("-").length - 1
                ]
            )[0];
            if (style) {
                let printOutItems = unprintedItems.filter(
                (i) =>
                    i.styleV2.toString() == style._id.toString() &&
                    i.color.toString() == inventory_item.color.toString() &&
                    i.sizeName.toString() == inventory_item.size_name.toString()
                );
                let qty = item.quantity;
                for (let item of printOutItems) {
                if (qty <= 0) break;
                printOut.push(item._id);
                qty--;
                }
            }
        }
      }
    }
    console.log("hm");
    order.received = true;
    await order.save();
    return NextResponse.json({error: false, printOut});
}