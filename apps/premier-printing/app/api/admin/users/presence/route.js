import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";

const ONLINE_MS = 5 * 60 * 1000;

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.permissions?.charts) {
        return NextResponse.json({ error: true, msg: "Access denied" }, { status: 403 });
    }

    const since = new Date(Date.now() - ONLINE_MS);
    const users = await User.find({ lastSeen: { $gte: since } })
        .select("userName firstName lastName currentPage previousPage pageEnteredAt lastSeen avatar role")
        .lean();

    return NextResponse.json({ error: false, users });
}
