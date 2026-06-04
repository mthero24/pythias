import { NextResponse } from "next/server";
import { ProductInventory } from "@pythias/mongo";

export async function GET(req) {
    try {
        const [totalCount, topReturned] = await Promise.all([
            ProductInventory.countDocuments({ delete: { $ne: true } }),
            ProductInventory.find({ delete: { $ne: true }, quantity: { $gt: 0 } })
                .sort({ quantity: -1 })
                .limit(50)
                .lean(),
        ]);

        return NextResponse.json({ totalCount, topReturned, returnsByDay: [] });
    } catch (e) {
        console.error("[dashboard/returns]", e);
        return NextResponse.json({ error: true, msg: e.message, totalCount: 0, topReturned: [], returnsByDay: [] }, { status: 500 });
    }
}
