import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { User } from "@pythias/mongo";

const ONLINE_MS = 5 * 60 * 1000;

export async function GET(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true }, { status: 401 });

    const since = new Date(Date.now() - ONLINE_MS);
    const users = await User.find({ lastSeen: { $gte: since } })
        .select("userName firstName lastName currentPage previousPage pageEnteredAt lastSeen avatar role")
        .lean();

    return NextResponse.json({ error: false, users });
}
