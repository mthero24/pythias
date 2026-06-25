import { NextResponse } from "next/server";
import { FounderOrg } from "@/models/Org";

export const dynamic = "force-dynamic";

// Powers the top promo bar. `enabled` is a RUNTIME flag (FOUNDING_BAR_ON=1) so the bar can be
// switched on Friday without a rebuild; `count` lets the bar pick the right tier text and hide at 100.
export async function GET() {
    try {
        const count = await FounderOrg.countDocuments({ founder: true });
        return NextResponse.json(
            { count, enabled: process.env.FOUNDING_BAR_ON === "1" },
            { headers: { "Cache-Control": "public, max-age=60" } }
        );
    } catch {
        return NextResponse.json({ count: 0, enabled: process.env.FOUNDING_BAR_ON === "1" });
    }
}
