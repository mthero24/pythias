import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformUser } from "@pythias/mongo";

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["owner", "admin"].includes(session.user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { userId, password } = await req.json();
    if (!userId || !password) return NextResponse.json({ error: "userId and password required" }, { status: 400 });

    const target = await PlatformUser.findOne({ _id: userId, orgId: session.user.orgId });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.role === "owner") return NextResponse.json({ error: "Cannot reset owner password this way" }, { status: 403 });

    target.password = password;
    await target.save();

    return NextResponse.json({ ok: true });
}
