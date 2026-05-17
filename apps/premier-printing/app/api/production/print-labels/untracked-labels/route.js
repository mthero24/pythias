import Items from "@/models/Items";
import Order from "@/models/Order";
import Inventory from "@/models/inventory";
import {NextApiResponse, NextResponse} from "next/server";

export async function GET(req=NextApiResponse){
    try {
        let date = new Date();
        date.setDate(date.getDate() - 4);
  
        let endDate = new Date();
        endDate.setDate(endDate.getDate() - 2);
  
        let skip = ["BTN", "MGN", "BUMP"];
  
        let items = await Items.find({
          labelPrinted: true,
          labelPrintedDates: { $gt: date, $lt: endDate },
          printed: false,
          folded: false,
          shipped: false,
          canceled: false,
          styleCode: { $nin: skip },
        })
          .sort({ labelLastPrinted: -1 }).populate("color", "name").populate("designRef", "sku name printType")
          .lean();
        console.log(items.length)
         items = items.filter(i=> new Date(i.labelPrintedDates[i.labelPrintedDates.length - 1]).getTime() < Date.now() - (3 * (24 * 60 * 60 * 1000)))

        // Fetch orders and inventory in parallel; query only the inventory combos present in these items
        const orderIds = items.map(s => s.order);
        const invCombos = [...new Map(
            items.map(s => [`${s.styleCode}|${s.color?.name}|${s.sizeName}`, { style_code: s.styleCode, color_name: s.color?.name, size_name: s.sizeName }])
        ).values()];

        const [standardOrders, inventoryArray] = await Promise.all([
            Order.find({ _id: { $in: orderIds } }).select("poNumber items marketplace").lean(),
            invCombos.length > 0
                ? Inventory.find({ $or: invCombos }).select("row unit shelf bin color_name size_name style_code quantity pending_quantity").lean()
                : [],
        ]);

        const orderMap = Object.fromEntries(standardOrders.map(o => [o._id.toString(), o]));
        const invMap = Object.fromEntries(inventoryArray.map(i => [`${i.style_code}|${i.color_name}|${i.size_name}`, i]));

        items = items.map(s => ({
            ...s,
            order: orderMap[s.order.toString()],
            inventory: invMap[`${s.styleCode}|${s.color?.name}|${s.sizeName}`],
        }))
        //console.log(items.length, items[0].labelLastPrinted, "after map");
        return NextResponse.json(items);
      } catch (e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: "something went wrong" });
      }
}