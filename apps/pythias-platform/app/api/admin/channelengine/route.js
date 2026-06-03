import { NextResponse } from "next/server";
import { getSettings } from "@/functions/channelEngine";

export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json({ error: false, settings });
    } catch (e) {
        console.error("[channelengine/settings]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
