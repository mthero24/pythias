import { NextResponse } from "next/server";
import Blanks from "@/models/StyleV2";
import { Inventory, InventoryOrders } from "@pythias/mongo";
import Items from "@/models/Items";

export async function GET() {
    const [unmetDemand, reorderInventory] = await Promise.all([
        // Group by inventory ID — avoids string-matching issues between item.styleCode and inv.style_code
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
        // Reorder candidates: only when on-hand PLUS what's already on order (pending_quantity) is
        // still at/below the reorder point. Without counting pending_quantity, a just-ordered item
        // stays ≤ its reorder point (quantity doesn't rise until received) and wrongly reappears.
        Inventory.find(
            { $expr: { $lte: [{ $add: ["$quantity", { $ifNull: ["$pending_quantity", 0] }] }, "$order_at_quantity"] } },
            "_id"
        ).lean(),
    ]);

    const demandMap = new Map(unmetDemand.map(r => [r._id.toString(), r.count]));
    const reorderIds = reorderInventory.map(r => r._id.toString());
    const allInvIds = [...new Set([...demandMap.keys(), ...reorderIds])];

    if (!allInvIds.length) return NextResponse.json({ error: false, blanks: [] });

    const [inventory, activeOrders] = await Promise.all([
        Inventory.find({ _id: { $in: allInvIds } })
            .populate("color")
            .select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin allocated attachedCount sizeId skus")
            .lean(),
        InventoryOrders.find(
            { received: { $ne: true }, "locations.items.inventory": { $in: allInvIds } },
            "locations"
        ).lean(),
    ]);

    // Sum active (unreceived) PO quantity per inventory from authoritative InventoryOrders
    const activeOnOrderMap = new Map();
    for (const po of activeOrders) {
        for (const loc of po.locations || []) {
            if (loc.received) continue;
            for (const item of loc.items || []) {
                const k = item.inventory?.toString();
                if (!k) continue;
                activeOnOrderMap.set(k, (activeOnOrderMap.get(k) ?? 0) + (item.quantity ?? 0));
            }
        }
    }

    // Patch live demand counts and active-order quantity; persist attachedCount fire-and-forget
    const invOps = [];
    for (const inv of inventory) {
        const id = inv._id.toString();
        inv.attachedCount = demandMap.get(id) ?? 0;
        inv.activeOnOrder = activeOnOrderMap.get(id) ?? 0;
        invOps.push({ updateOne: { filter: { _id: inv._id }, update: { $set: { attachedCount: inv.attachedCount } } } });
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
