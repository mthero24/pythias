import { NextResponse } from "next/server";
import Blanks from "@/models/StyleV2";
import { Inventory } from "@pythias/mongo";
import Items from "@/models/Items";

export async function GET() {
    // Real-time attached count from Items (TSPprints has stockStatus)
    const [attachedCounts, reorderInvIds] = await Promise.all([
        Items.aggregate([
            { $match: { stockStatus: "attached", canceled: false, paid: true } },
            { $group: { _id: "$inventory.inventory", count: { $sum: 1 } } },
        ]),
        Inventory.find(
            { $expr: { $lte: ["$quantity", "$order_at_quantity"] } },
            "_id"
        ).lean(),
    ]);

    const attachedCountMap = new Map(
        attachedCounts.filter(r => r._id).map(r => [r._id.toString(), r.count])
    );
    const allInvIds = [...new Set([
        ...attachedCountMap.keys(),
        ...reorderInvIds.map(r => r._id.toString()),
    ])];

    if (!allInvIds.length) return NextResponse.json({ error: false, blanks: [] });

    const inventory = await Inventory.find({ _id: { $in: allInvIds } })
        .populate("color")
        .select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin allocated attachedCount sizeId skus orders")
        .lean();

    // Patch live count onto each doc and persist for future reads (fire-and-forget)
    const invOps = [];
    inventory.forEach(inv => {
        const count = attachedCountMap.get(inv._id.toString()) ?? 0;
        inv.attachedCount = count;
        invOps.push({ updateOne: { filter: { _id: inv._id }, update: { $set: { attachedCount: count } } } });
    });
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
