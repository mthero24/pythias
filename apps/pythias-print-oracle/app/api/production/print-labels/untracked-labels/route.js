import Items from "../../../../../models/Items";
import Order from "../../../../../models/Order";
import {NextApiResponse, NextResponse} from "next/server";

export async function GET(req=NextApiResponse){
    try {
        let date = new Date();
        date.setDate(date.getDate() - 3);
  
        let endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
  
        let skip = ["BTN", "MGN", "BUMP"];
  
        let items = await Items.find({
          labelPrinted: true,
          labelLastPrinted: { $gt: date, $lt: endDate },
          treated: false,
          printed: false,
          folded: false,
          shipped: false,
          canceled: false,
          styleCode: { $nin: skip },
        })
          .sort({ labelLastPrinted: -1 })
          .limit(1000)
          .lean();
        console.log(items[1].labelLastPrinted, new Date(items[1].labelLastPrinted).getTime(), Date.now() - (3 * (24 * 60 * 60 * 1000)), new Date(items[1].labelLastPrinted).getTime() < Date.now() - (3 * (24 * 60 * 60 * 1000)))
        items = items.filter(i=> new Date(i.labelLastPrinted).getTime() < Date.now() - (3 * (24 * 60 * 60 * 1000)))
        let standardOrders = items.map(s=> s.order)
        standardOrders = await Order.find({_id: {$in: standardOrders}}).select("poNumber items").lean()
        //console.log(standardOrders.length, "standatd orders", standardOrders[0], items[0].order.toString())
        items = items.map(s=> { s.order = standardOrders.filter(o=> o._id.toString() == s.order.toString())[0]; console.log(s.order, "order map");  return {...s}})
        //console.log(items.length, items[0].labelLastPrinted, "after map");
        return NextResponse.json(items);
      } catch (e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: "something went wrong" });
      }
}