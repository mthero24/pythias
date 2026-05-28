import { NextResponse } from "next/server";
import { Blank as Blanks, Inventory, Items } from "@pythias/mongo";

export async function GET() {
    const [unmetDemand, reorderInventory] = await Promise.all([
        // Live aggregate: items not in stock and not already on order, grouped by inventory
        Items.aggregate([
            {
                $match: {
                    paid: true,
                    canceled: false,
                    shipped: false,
                    labelPrinted: false,
                    stockStatus: { $nin: ["inStock", "ordered"] },
                    "inventory.inventory": { $exists: true, $ne: null },
                }
            },
            {
                $group: {
                    _id: "$inventory.inventory",
                    count: { $sum: 1 },
                }
            }
        ]),
        Inventory.find(
            { $expr: { $lte: ["$quantity", "$order_at_quantity"] } },
            "_id"
        ).lean(),
    ]);

    const demandMap = new Map(unmetDemand.map(r => [r._id.toString(), r.count]));
    const reorderIds = reorderInventory.map(r => r._id.toString());
    const allInvIds = [...new Set([...demandMap.keys(), ...reorderIds])];

    if (!allInvIds.length) return NextResponse.json({ error: false, blanks: [] });

    const inventory = await Inventory.find({ _id: { $in: allInvIds } })
        .populate("color")
        .select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin allocated attachedCount sizeId skus orders")
        .lean();

    // Patch live demand count and persist fire-and-forget
    const invOps = [];
    for (const inv of inventory) {
        const liveCount = demandMap.get(inv._id.toString()) ?? 0;
        inv.attachedCount = liveCount;
        invOps.push({ updateOne: { filter: { _id: inv._id }, update: { $set: { attachedCount: liveCount } } } });
    }
    if (invOps.length) Inventory.bulkWrite(invOps, { ordered: false });

    const blankCodes = [...new Set(inventory.map(i => i.style_code))];
    const blanks = await Blanks.find({ code: { $in: blankCodes } })
        .select("code name colors sizes department")
        .collation({ locale: "en", strength: 2 })
        .lean();

    const combined = blanks.map(blank => ({
        blank,
        inventories: inventory.filter(i => i.style_code === blank.code),
    }));

    return NextResponse.json({ error: false, blanks: combined });
}
