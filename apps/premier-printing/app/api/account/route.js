import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const user = await User.findOne({ userName: token.userName })
        .select("userName firstName lastName email role avatar")
        .lean();
    return NextResponse.json({ error: false, user });
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const body = await req.json();

    if (body.currentPassword !== undefined) {
        const user = await User.findOne({ userName: token.userName });
        if (!user) return NextResponse.json({ error: true, msg: "User not found" }, { status: 404 });
        const ok = await user.comparePassword(body.currentPassword);
        if (!ok) return NextResponse.json({ error: true, msg: "Incorrect current password" }, { status: 400 });
        user.password = body.newPassword;
        await user.save();
        return NextResponse.json({ error: false });
    }

    const { firstName, lastName, avatar } = body;
    const update = {};
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (avatar !== undefined) update.avatar = avatar;
    await User.findOneAndUpdate({ userName: token.userName }, { $set: update });
    return NextResponse.json({ error: false });
}
