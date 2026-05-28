import { NextResponse } from "next/server";
import { updateInventory, recomputeStockStatus } from "@/functions/pullOrders";
import { LabelsData } from "@/functions/labels";
import { Inventory, Items } from "@pythias/mongo";

export async function POST() {
    try {
        // Rebuild inStock/attached arrays, then recompute every item's stockStatus
        await updateInventory();
        await recomputeStockStatus();

        // Recount and fix allocated + attachedCount counters to match new stockStatus values
        const [inStockCounts, attachedCounts, allInvs] = await Promise.all([
            Items.aggregate([
                { $match: { stockStatus: "inStock", canceled: false, shipped: false, paid: true, "inventory.inventory": { $exists: true, $ne: null } } },
                { $group: { _id: "$inventory.inventory", count: { $sum: 1 } } },
            ]),
            Items.aggregate([
                { $match: { stockStatus: "attached", canceled: false, paid: true, "inventory.inventory": { $exists: true, $ne: null } } },
                { $group: { _id: "$inventory.inventory", count: { $sum: 1 } } },
            ]),
            Inventory.find({}, "_id").lean(),
        ]);
        const inStockMap  = new Map(inStockCounts.map(r => [r._id.toString(), r.count]));
        const attachedMap = new Map(attachedCounts.map(r => [r._id.toString(), r.count]));
        const reconcileOps = allInvs.map(inv => ({
            updateOne: { filter: { _id: inv._id }, update: { $set: {
                allocated:     inStockMap.get(inv._id.toString())  ?? 0,
                attachedCount: attachedMap.get(inv._id.toString()) ?? 0,
            } } },
        }));
        if (reconcileOps.length) await Inventory.bulkWrite(reconcileOps, { ordered: false });

        // Return fresh labels data so the page refreshes
        const { labels, giftMessages, rePulls, batches } = await LabelsData();
        return NextResponse.json({ error: false, labels, giftMessages, rePulls, batches });
    } catch (e) {
        console.error("[update-inventory]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
