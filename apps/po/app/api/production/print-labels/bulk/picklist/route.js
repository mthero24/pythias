import { NextResponse } from "next/server";
import Items from "@/models/Items";
import Order from "@/models/Order";
import { Settings } from "@pythias/mongo";
import { getShippingCreds } from "@/lib/getShippingCreds";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { buildPicklistPdf } from "@pythias/labels";

export async function POST(req) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);

    const { items, poNumber, printer } = await req.json();
    if (!items?.length) return NextResponse.json({ error: true, msg: "No items" }, { status: 400 });

    try {
        const [sc, templateDoc] = await Promise.all([
            getShippingCreds(),
            Settings.findOne({ key: "picklistTemplate" }).lean(),
        ]);
        const template = templateDoc?.value ? JSON.parse(templateDoc.value) : {};

        await buildPicklistPdf({ items, poNumber, sc, printer: printer ?? "printer1", template });

        // Mark all items in each order as label-printed
        const orderIds = [...new Set(
            items.map(i => i.order?._id ?? i.order).filter(Boolean)
        )];

        const now = new Date();
        await Items.updateMany(
            { order: { $in: orderIds }, canceled: false },
            {
                labelPrinted: true,
                $push: {
                    labelPrintedDates: { $each: [now] },
                    steps: { $each: [{ status: "picklist printed", date: now }] },
                },
            },
        );

        await Order.updateMany(
            { _id: { $in: orderIds } },
            { bulkPrinted: true },
        );

        logActivity({ action: "picklist_print", entity: "order", count: items.length, userName, email, provider: "po" });

        return NextResponse.json({ error: false });
    } catch (e) {
        console.error("[bulk/picklist]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
