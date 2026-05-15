import { NextResponse } from "next/server";
import { runTracking } from "@/functions/tracking";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        const result = await runTracking();
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: e.message });
    }
}
