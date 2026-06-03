import { NextResponse } from "next/server";
import { listChannels, CEPermissionError } from "@/functions/channelEngine";

// GET /api/admin/channelengine/channels
export async function GET() {
    try {
        const result = await listChannels();
        const channels = (result?.Content ?? result ?? []).map(c => ({
            id:   c.Id   ?? c.ChannelId,
            name: c.Name ?? c.ChannelName ?? String(c.Id),
            type: c.Type ?? c.ChannelType ?? null,
        })).filter(c => c.id != null);
        return NextResponse.json({ error: false, channels });
    } catch (e) {
        if (e instanceof CEPermissionError)
            return NextResponse.json({ error: false, channels: [], noPermission: true });
        console.error("[channelengine/channels GET]", e.message);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
