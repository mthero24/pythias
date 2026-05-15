import { NextResponse } from "next/server";
import { ProductInventory } from "@pythias/mongo";

export async function GET() {
    const items = await ProductInventory.find({ quantity: { $gt: 0 }, delete: { $ne: true } })
        .select("sku designSku blankCode colorName sizeName quantity location")
        .lean();

    return NextResponse.json({ items });
}
