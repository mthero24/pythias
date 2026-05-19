import { NextResponse } from "next/server";
import Blanks from "@/models/StyleV2";
import { Inventory } from "@pythias/mongo";
import Items from "@/models/Items";

export async function GET() {
    const [unmetDemand, reorderInventory] = await Promise.all([
        // Group unmet demand by style/color/size — catches items with or without inventory assigned
        Items.aggregate([
            {
                $match: {
                    paid: true,
                    canceled: false,
                    shipped: false,
                    labelPrinted: false,
                    stockStatus: { $nin: ["inStock", "ordered"] },
                    styleCode: { $exists: true, $ne: null },
                    colorName: { $exists: true, $ne: null },
                    sizeName:  { $exists: true, $ne: null },
                }
            },
            {
                $group: {
                    _id: { styleCode: "$styleCode", colorName: "$colorName", sizeName: "$sizeName" },
                    count: { $sum: 1 },
                }
            }
        ]),
        Inventory.find(
            { $expr: { $lte: ["$quantity", "$order_at_quantity"] } },
            "_id"
        ).lean(),
    ]);

    // Build demand map keyed by "styleCode|colorName|sizeName"
    const demandMap = new Map();
    const demandStyleCodes = new Set();
    for (const r of unmetDemand) {
        const key = `${r._id.styleCode}|${r._id.colorName}|${r._id.sizeName}`;
        demandMap.set(key, r.count);
        demandStyleCodes.add(r._id.styleCode);
    }

    const reorderIds = reorderInventory.map(r => r._id.toString());

    // Fetch inventory docs: by style_code for unmet demand, by _id for reorder threshold
    const [demandInvDocs, reorderInvDocs] = await Promise.all([
        demandStyleCodes.size
            ? Inventory.find({ style_code: { $in: [...demandStyleCodes] } })
                .populate("color")
                .select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin allocated attachedCount sizeId skus orders")
                .lean()
            : [],
        reorderIds.length
            ? Inventory.find({ _id: { $in: reorderIds } })
                .populate("color")
                .select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin allocated attachedCount sizeId skus orders")
                .lean()
            : [],
    ]);

    // Merge and deduplicate
    const invMap = new Map();
    for (const inv of [...demandInvDocs, ...reorderInvDocs]) {
        invMap.set(inv._id.toString(), inv);
    }
    const inventory = [...invMap.values()];

    // Patch live attachedCount from demand aggregate and persist fire-and-forget
    const invOps = [];
    for (const inv of inventory) {
        const key = `${inv.style_code}|${inv.color_name}|${inv.size_name}`;
        inv.attachedCount = demandMap.get(key) ?? 0;
        invOps.push({ updateOne: { filter: { _id: inv._id }, update: { $set: { attachedCount: inv.attachedCount } } } });
    }
    if (invOps.length) Inventory.bulkWrite(invOps, { ordered: false });

    if (!inventory.length) return NextResponse.json({ error: false, blanks: [] });

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
