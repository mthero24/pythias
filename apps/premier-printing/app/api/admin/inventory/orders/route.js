import Inventory from "@/models/inventory";
import InventoryOrders from "@/models/InventoryOrders";
import {NextApiRequest, NextResponse} from "next/server";

export async function GET(req){
    let month = new Date();
    month.setDate(month.getDate() - 30);
    let inventoryOrders = await InventoryOrders.find({
      date: { $gt: month },
      received: { $ne: true },
    })
      .sort({ date: -1 })
      .populate("items.inventory")
      .lean();
    res.send(inventoryOrders);
    let inventory_items = await Inventory.find({
      pending_quantity: { $gt: 0 },
    });
    updatePendingInventory(inventory_items);
    return NextResponse.json({error: false});
}

export async function POST(){
    let inventory_items = await Inventory.find({
    inventory_id: {
        $in: [...new Set(req.body.inOrder.map((i) => i.inventory_id))],
    },
    });

    for (let key of Object.keys(req.body.po)) {
        let order_items = req.body.inOrder.filter((i) => i.vendor == key);
        let items = order_items.map((item) => {
            let inventory_item = inventory_items.filter(
            (i) => i.inventory_id == item.inventory_id
            )[0];
            if (inventory_item) {
            inventory_item.pending_quantity += Number(item.quantity);
            inventory_item.save();
            }
            return {
            quantity: Number(item.quantity),
            state: item.state ? item.state : undefined,
            inventory: inventory_item && inventory_item._id,
            };
        });
        if (items.length > 0) {
            let state_keys = [...new Set(items.map((i) => i.state))];
            console.log(state_keys);
            for (let state of state_keys) {
            let name = req.body.po[key];
            if (state) {
                name += `-${state}`;
            }
            let inventoryOrder = new InventoryOrders({
                orderType: "Manual",
                date: new Date(),
                name,
                vendor: key,
                items: items.filter((item) => item.state == state),
            });
            await inventoryOrder.save();
            }
        }
    }
    updatePendingInventory(inventory_items);
    return NextResponse.json({error: false});
}

const updatePendingInventory = async (inventory_items) => {
    console.log("updatePendingInventory()");
    let month = new Date();
    month.setDate(month.getDate() - 30);
    let openOrders = await InventoryOrders.find({
      received: { $ne: true },
      date: { $gt: month },
    });
    for (let item of inventory_items) {
      item.pending_quantity = 0;
      for (let order of openOrders) {
        let order_item = order.items.filter(
          (i) => i.inventory.toString() == item._id.toString()
        )[0];
        if (order_item) {
          item.pending_quantity += order_item.quantity;
        }
      }
      await item.save();
    }
  };