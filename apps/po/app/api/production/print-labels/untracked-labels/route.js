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
        const orderIds = items.map(s => s.order);
        const standardOrders = await Order.find({ _id: { $in: orderIds } }).select("poNumber items").lean();
        items = items.map(s => { s.order = standardOrders.find(o => o._id.toString() === s.order.toString()); return { ...s }; });
        //console.log(items.length, items[0].labelLastPrinted, "after map");
        return NextResponse.json(items);
      } catch (e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: "something went wrong" });
      }
}