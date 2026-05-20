import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { User } from "@pythias/mongo";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const users = await User.find({})
        .select("userName firstName lastName avatar role lastSeen")
        .lean();
    return NextResponse.json({ error: false, users });
}
