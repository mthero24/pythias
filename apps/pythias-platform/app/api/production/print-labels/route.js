import { NextResponse } from "next/server";
import { PlatformItem, Batches } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getOrgCreds } from "@/lib/getOrgCreds";
import { buildLabelData, loadTemplate } from "@/functions/buildLabelData";
import { LabelsData } from "@/functions/labelsData";
import axios from "axios";
import btoa from "btoa";

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const data = await req.json();
    const [creds, template] = await Promise.all([getOrgCreds(orgId), loadTemplate()]);

    let batchID = "";
    for (let i = 0; i < 9; i++) batchID += LETTERS[Math.floor(Math.random() * LETTERS.length)];

    const printableItems = data.items.filter(i => !i.labelPrinted);

    let labelsString = "";
    const pieceIds = [];
    for (let i = 0; i < printableItems.length; i++) {
        labelsString += await buildLabelData(printableItems[i], i, data.poNumber, null, template);
        pieceIds.push(printableItems[i].pieceId);
    }

    const encoded = btoa(labelsString);
    const headers = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.localKey}` } };

    // ZPL → /api/print-labels (direct Zebra)  |  PDF → /api/cpu (file writer)
    const printEndpoint = template.format === "PDF" ? "cpu" : "print-labels";
    await axios
        .post(`http://${creds.localIP}/api/${printEndpoint}`, { label: encoded, printer: "printer1" }, headers)
        .catch(e => console.error("print-labels:", e.message));

    const batch = new Batches({ batchID, date: new Date(), count: printableItems.length });
    await batch.save();

    await PlatformItem.updateMany(
        { orgId, pieceId: { $in: pieceIds } },
        {
            labelPrinted: true,
            $push: {
                labelPrintedDates: { $each: [new Date()] },
                steps: { $each: [{ status: "label Printed", date: new Date() }] },
            },
        },
    );

    const { labels, giftMessages, rePulls, batches } = await LabelsData(orgId);
    return NextResponse.json({ error: false, labels, giftMessages, rePulls, batches });
}
