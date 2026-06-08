import { NextResponse } from "next/server";
import Items from "../../../../models/Items";

// One-time cleanup: mark all stale gift-message items as labelPrinted.
// These were previously handled by the sublimation page which never set labelPrinted=true.
// Hit POST /api/admin/cleanup-gift-messages once, then delete this route.
export async function POST() {
    const result = await Items.updateMany(
        { type: "gift", sku: "gift-message", labelPrinted: false },
        { $set: { labelPrinted: true } }
    );
    return NextResponse.json({ error: false, updated: result.modifiedCount });
}
