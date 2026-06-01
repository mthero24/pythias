import { NextResponse } from "next/server";
import { PlatformItem, PlatformOrder, Batches } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getOrgCreds } from "@/lib/getOrgCreds";
import { buildLabelData } from "@/functions/buildLabelData";
import axios from "axios";
import btoa from "btoa";

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const { items, poNumber } = await req.json();
    if (!items?.length) return NextResponse.json({ error: true, msg: "No items" }, { status: 400 });

    const creds = await getOrgCreds(orgId);

    let batchID = "";
    for (let i = 0; i < 9; i++) batchID += LETTERS[Math.floor(Math.random() * LETTERS.length)];

    const printableItems = items.filter(i => !i.labelPrinted);

    let labelsString = "";
    const pieceIds = [];
    for (let i = 0; i < printableItems.length; i++) {
        const labelStr = await buildLabelData(printableItems[i], i, poNumber, null);
        labelsString += labelStr;
        pieceIds.push(printableItems[i].pieceId);
    }

    const encoded = btoa(labelsString);
    await axios.post(
        `http://${creds.localIP}/api/print-labels`,
        { label: encoded, printer: "printer1" },
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.localKey}` } },
    ).catch(e => console.error("[bulk/print-labels]", e.message));

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

    // Mark the order's bulkPrinted once all labels are printed
    if (poNumber) {
        await PlatformOrder.findOneAndUpdate(
            { orgId, poNumber, bulk: true },
            { bulkPrinted: true },
        );
    }

    return NextResponse.json({ error: false, ok: true });
}
