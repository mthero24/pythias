import { Items, Order } from "@pythias/mongo";
import { NextResponse } from "next/server";
import { Sort } from "@pythias/labels";
import { buildLabelData, loadTemplate } from "@/functions/labelString";
import { LabelsData } from "@/functions/labels";
import axios from "axios";
import btoa from "btoa";
import { getShippingCreds } from "@/lib/getShippingCreds";

export async function POST(req) {
    const data = await req.json();

    const [sc, template] = await Promise.all([getShippingCreds(), loadTemplate()]);

    let items = await Items.find({ batchID: data.batchID })
        .populate("designRef inventory.inventory inventory.productInventory")
        .lean();

    const orderIds = items.map(i => i.order);
    const orders = await Order.find({ _id: { $in: orderIds } }).select("poNumber items marketplace").lean();
    const orderMap = new Map(orders.map(o => [o._id.toString(), o]));

    items = items
        .map(i => ({ ...i, order: orderMap.get(i.order?.toString()) }))
        .filter(i => i.order);
    items = await Sort(items);

    const preLabels = await Promise.all(
        items.map((item, j) => buildLabelData(item, j, item.order?.poNumber, {}, null, template))
    );

    let labelsString = "";
    preLabels.slice(parseInt(data.lastIndex ?? 0)).forEach(l => { labelsString += l; });
    labelsString = btoa(labelsString);

    const headers = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${sc.localKey}` } };
    const printEndpoint = template.format === "PDF" ? "cpu" : "print-labels";
    await axios
        .post(`http://${sc.localIP}/api/${printEndpoint}`, { label: labelsString, printer: "printer1" }, headers)
        .catch(e => console.error("restore/print-labels:", e.message));

    const { labels, giftMessages, rePulls, batches } = await LabelsData();
    return NextResponse.json({ error: false, msg: "reprinted", labels, giftMessages: giftMessages ?? [], rePulls, batches });
}
