import { NextApiRequest, NextResponse } from "next/server";
import Items from "@/models/Items";
import Order from "@/models/Order";
import Batches from "@/models/batches";
import btoa from "btoa";
import axios from "axios";
import { buildBulkLabelData } from "@/functions/bulkLabelString";
import { Inventory } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { logActivity, userFromToken } from "@pythias/backend/server";
import { getShippingCreds } from "@/lib/getShippingCreds";

const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

const subtractInventory = async (item) => {
    if (item.type === "gift") return;
    const invId = item.inventory?._id ?? item.inventory;
    if (!invId) return;
    const inv = await Inventory.findOne({ _id: invId });
    if (!inv) return;
    const itemIds = new Set((item.items ?? []).map(i => i._id.toString()));
    inv.quantity = inv.quantity - item.quantity;
    inv.inStock  = (inv.inStock  ?? []).filter(i => !itemIds.has(i.toString()));
    inv.attached = (inv.attached ?? []).filter(i => !itemIds.has(i.toString()));
    await inv.save();
};

export const config = {
    api: { bodyParser: { sizeLimit: "10mb" } },
};

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const { userName, email } = userFromToken(token);

    let data;
    try {
        data = await req.json();
    } catch {
        return NextResponse.json({ error: true, msg: "Invalid request body" }, { status: 400 });
    }

    if (!data?.items?.length) {
        return NextResponse.json({ error: true, msg: "No items" }, { status: 400 });
    }

    try {
        // Build batch ID
        let batchID = "";
        for (let i = 0; i < 9; i++)
            batchID += letters[Math.floor(Math.random() * letters.length)];

        // Build label strings and subtract inventory
        let labelsString = "";
        const pieceIds = [];
        let j = 1;
        for (const item of data.items) {
            const label = await buildBulkLabelData(item, j);
            labelsString += label;
            pieceIds.push(item.bulkId);
            j++;
            await subtractInventory(item);
        }

        // Encode for printer
        const encoded = btoa(labelsString);

        // Send to printer — 10 s timeout so the route never hangs
        const sc = await getShippingCreds();
        const headers = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sc.localKey}`,
            },
            timeout: 10_000,
        };
        await axios
            .post(`http://${sc.localIP}/api/print-labels`, { label: encoded, printer: "printer1" }, headers)
            .catch(e => console.error("[bulk-labels] printer error:", e.message));

        // Persist batch + item updates
        const now = new Date();
        await new Batches({ batchID, date: now, count: pieceIds.length }).save();
        await Items.updateMany(
            { bulkId: { $in: pieceIds } },
            {
                labelPrinted: true,
                $push: {
                    labelPrintedDates: { $each: [now] },
                    steps: { $each: [{ status: "label Printed", date: now }] },
                },
                batchID,
            }
        );

        // Mark order printed
        const order = await Order.findOne({ _id: data.items[0].order._id });
        if (order) {
            order.bulkPrinted = true;
            await order.save();
        }

        logActivity({ action: "label_print", entity: "order", count: pieceIds.length, userName, email, provider: "po" });

        return NextResponse.json({ error: false });
    } catch (e) {
        console.error("[bulk-labels] error:", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
