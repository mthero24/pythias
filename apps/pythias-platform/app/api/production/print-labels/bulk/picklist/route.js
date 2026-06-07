import { NextResponse } from "next/server";
import { PlatformItem, PlatformOrder, Settings } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getOrgCreds } from "@/lib/getOrgCreds";
import { buildPicklistPdf } from "@pythias/labels";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const orgId = token.orgId;
    const { items, poNumber, printer } = await req.json();
    if (!items?.length) return NextResponse.json({ error: true, msg: "No items" }, { status: 400 });

    try {
        const [creds, templateDoc] = await Promise.all([
            getOrgCreds(orgId),
            Settings.findOne({ key: "picklistTemplate" }).lean(),
        ]);
        const template = templateDoc?.value ? JSON.parse(templateDoc.value) : {};

        const sc = { localIP: creds.localIP, localKey: creds.localKey };
        await buildPicklistPdf({ items, poNumber, sc, printer: printer ?? "printer1", template });

        // Mark all items in each order as label-printed
        const orderIds = [...new Set(
            items.map(i => i.order?._id ?? i.order).filter(Boolean)
        )];

        const now = new Date();
        await PlatformItem.updateMany(
            { orgId, order: { $in: orderIds }, cancelled: false },
            {
                labelPrinted: true,
                $push: {
                    labelPrintedDates: { $each: [now] },
                    steps: { $each: [{ status: "picklist printed", date: now }] },
                },
            },
        );

        await PlatformOrder.updateMany(
            { orgId, _id: { $in: orderIds } },
            { bulkPrinted: true },
        );

        return NextResponse.json({ error: false });
    } catch (e) {
        console.error("[platform/bulk/picklist]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
