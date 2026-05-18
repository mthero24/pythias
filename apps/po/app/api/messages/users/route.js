import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.userName && !token?.email) return NextResponse.json({ error: true }, { status: 401 });
    const users = await User.find({ type: { $in: ["production", "manager", "admin"] } })
        .select("firstName lastName email isAdmin type avatar lastSeen")
        .lean();
    return NextResponse.json({
        error: false,
        users: users.map(u => ({
            ...u,
            userName: u.email,
            role: u.isAdmin ? "admin" : u.type,
        })),
    });
}
