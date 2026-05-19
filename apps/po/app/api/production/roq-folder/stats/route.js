import { NextResponse } from "next/server";
import Items from "../../../../../models/Items";

export async function GET() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [folded, shipped] = await Promise.all([
        Items.countDocuments({ folded: true, "lastScan.station": "ROQ Folded", "lastScan.date": { $gte: startOfDay } }),
        Items.countDocuments({ shipped: true, "lastScan.station": "ROQ Folded", "lastScan.date": { $gte: startOfDay } }),
    ]);

    return NextResponse.json({ error: false, folded, shipped });
}
