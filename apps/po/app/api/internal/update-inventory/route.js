import { NextResponse } from "next/server";
import { addItemsToInventory, reconcileAllocated, recomputeStockStatus } from "@/functions/addItemsToInventory";
import { LabelsData } from "@/functions/labels";

export async function POST() {
    try {
        await reconcileAllocated();
        await addItemsToInventory();
        await recomputeStockStatus();
        const { labels, giftMessages, rePulls, batches } = await LabelsData();
        return NextResponse.json({ error: false, labels, giftMessages, rePulls, batches });
    } catch (e) {
        console.error("[update-inventory]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
