import { PlatformItem as Items, PlatformOrder as Order } from "@pythias/mongo";
import { NextResponse } from "next/server";
import { Sort } from "@pythias/labels";
import { buildLabelData, loadTemplate } from "@/functions/buildLabelData";
import { LabelsData } from "@/functions/labelsData";
import axios from "axios";
import btoa from "btoa";
import { getToken } from "next-auth/jwt";
import { getOrgCreds } from "@/lib/getOrgCreds";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const data = await req.json();

    const [creds, template] = await Promise.all([getOrgCreds(orgId), loadTemplate()]);

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
        items.map((item, j) => buildLabelData(item, j, item.order?.poNumber, null, template))
    );

    let labelsString = "";
    preLabels.slice(parseInt(data.lastIndex ?? 0), preLabels.length).forEach(l => { labelsString += l; });

    const encoded = btoa(labelsString);
    const headers = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.localKey}` } };

    const printEndpoint = template.format === "PDF" ? "cpu" : "print-labels";
    await axios
        .post(`http://${creds.localIP}/api/${printEndpoint}`, { label: encoded, printer: "printer1" }, headers)
        .catch(e => console.error("restore/print-labels:", e.message));

    const { labels, giftMessages, rePulls, batches } = await LabelsData(orgId);
    return NextResponse.json({ error: false, msg: "reprinted", labels, giftMessages: giftMessages ?? [], rePulls, batches });
}
