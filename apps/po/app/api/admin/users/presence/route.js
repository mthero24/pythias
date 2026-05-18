import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";

const ONLINE_MS = 5 * 60 * 1000;

export async function GET(req) {
    const token = await getToken({ req });
    if (token?.role !== "admin") return NextResponse.json({ error: true }, { status: 401 });

    const since = new Date(Date.now() - ONLINE_MS);
    const users = await User.find({ lastSeen: { $gte: since } })
        .select("email firstName lastName currentPage previousPage pageEnteredAt lastSeen avatar")
        .lean();

    return NextResponse.json({ error: false, users });
}
