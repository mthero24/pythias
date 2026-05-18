import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import User from "@/models/User";

export async function GET(req) {
    const token = await getToken({ req });
    const me = token?.userName ?? token?.email;
    if (!me) return NextResponse.json({ error: true }, { status: 401 });
    const user = await User.findOne({ email: me })
        .select("firstName lastName email isAdmin type avatar")
        .lean();
    return NextResponse.json({ error: false, user: user ? {
        ...user,
        userName: me,
        role: user.isAdmin ? "admin" : user.type,
    } : null });
}

export async function PUT(req) {
    const token = await getToken({ req });
    const me = token?.userName ?? token?.email;
    if (!me) return NextResponse.json({ error: true }, { status: 401 });
    const body = await req.json();

    if (body.currentPassword !== undefined) {
        const user = await User.findOne({ email: me });
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
    await User.findOneAndUpdate({ email: me }, { $set: update });
    return NextResponse.json({ error: false });
}
