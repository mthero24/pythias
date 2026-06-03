import { NextResponse } from "next/server";
import { PlatformProductInventory as ProductInventory } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    const items = await ProductInventory.find({ orgId, quantity: { $gt: 0 }, delete: { $ne: true } })
        .select("sku designSku blankCode colorName sizeName quantity location")
        .lean();

    return NextResponse.json({ items });
}
