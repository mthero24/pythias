import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PlatformUser } from "@pythias/mongo";
import mongoose from "mongoose";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const orgId = new mongoose.Types.ObjectId(token.orgId);

    const users = await PlatformUser.find({ orgId, isActive: true })
        .select("userName firstName lastName avatar role lastSeen")
        .lean();
    return NextResponse.json({ error: false, users });
}
