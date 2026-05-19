import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Session } from "@/models/Analytics";

const ONLINE_MS = 5 * 60 * 1000;

export async function GET(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true }, { status: 401 });

    const since = new Date(Date.now() - ONLINE_MS);
    const sessions = await Session.find({
        lastSeen: { $gte: since },
        isBot: { $ne: true },
    })
        .select("sessionId entryPage pages lastSeen startedAt source referrer medium campaign")
        .sort({ lastSeen: -1 })
        .lean();

    return NextResponse.json({ error: false, sessions });
}
