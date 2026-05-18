import { NextResponse } from "next/server";
import { Blank as Blanks, Inventory } from "@pythias/mongo";

export async function GET() {
    // attachedCount is maintained on Inventory by apps/po — no cross-DB aggregate needed
    const inventory = await Inventory.find({
        $or: [
            { attachedCount: { $gt: 0 } },
            { $expr: { $lte: ["$quantity", "$order_at_quantity"] } },
        ],
    }).populate("color")
        .select("color color_name pending_quantity size_name style_code blank quantity order_at_quantity quantity_to_order location row unit shelf bin allocated attachedCount sizeId skus orders")
        .lean();

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
