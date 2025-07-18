import {Items, Order, Inventory} from "@pythias/mongo";
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
         let inventoryArray = await Inventory.find({}).select("row unit shelf bin ordered color_name size_name stye_code quantity pending_quantity").lean()
            .select("quantity pending_quantity inventory_id color_name size_name style_code row unit shelf bin")
            .lean();
        items = items.filter(i=> new Date(i.labelPrintedDates[i.labelPrintedDates.length - 1]).getTime() < Date.now() - (3 * (24 * 60 * 60 * 1000)))
        let standardOrders = items.map(s=> s.order)
        standardOrders = await Order.find({_id: {$in: standardOrders}}).select("poNumber items marketplace").lean()
        //console.log(standardOrders.length, "standatd orders", standardOrders[0], items[0].order.toString())
        items = items.map(s=> { s.order = standardOrders.filter(o=> o._id.toString() == s.order.toString())[0]; console.log(s.order, "order map");  return {...s}})
        items = items.map(s=> { s.inventory = inventoryArray.filter(i=> i.color_name == s.color.name && i.size_name == s.sizeName && i.style_code == s.styleCode)[0];  return {...s}})
        //console.log(items.length, items[0].labelLastPrinted, "after map");
        return NextResponse.json(items);
      } catch (e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: "something went wrong" });
      }
}