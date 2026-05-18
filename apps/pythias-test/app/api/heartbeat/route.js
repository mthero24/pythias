import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ valid: false });

    const user = await User.findOne({ userName: token.userName })
        .select("sessionToken")
        .lean();

    if (!user) return NextResponse.json({ valid: false });

    if (user.sessionToken && token.sessionToken !== user.sessionToken) {
        return NextResponse.json({ valid: false, reason: "new_device" });
    }

    await User.findOneAndUpdate(
        { userName: token.userName },
        { $set: { lastSeen: new Date() } }
    );

    return NextResponse.json({ valid: true });
}
