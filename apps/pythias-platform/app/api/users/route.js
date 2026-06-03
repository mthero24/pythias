import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformUser } from "@pythias/mongo";
import { checkUsage, incrementUsage } from "@/lib/usageEnforce";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await PlatformUser.find({ orgId: session.user.orgId })
        .select("-password")
        .lean();
    return NextResponse.json({ users });
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    if (!["owner", "admin"].includes(session.user.role))
        return NextResponse.json({ error: true, msg: "Insufficient permissions" }, { status: 403 });

    const body = await req.json();

    // Password reset: { user, password }
    if (body.user && body.password) {
        const target = await PlatformUser.findOne({ _id: body.user._id, orgId: session.user.orgId });
        if (!target) return NextResponse.json({ error: true, msg: "User not found" }, { status: 404 });
        target.password = body.password;
        await target.save();
        const users = await PlatformUser.find({ orgId: session.user.orgId })
            .select("userName firstName lastName email role permissions avatar lastSeen")
            .lean();
        return NextResponse.json({ error: false, users });
    }

    return NextResponse.json({ error: true, msg: "Invalid request" }, { status: 400 });
}

export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    if (!["owner", "admin"].includes(session.user.role))
        return NextResponse.json({ error: true, msg: "Insufficient permissions" }, { status: 403 });

    const { user } = await req.json();
    if (!user?._id) return NextResponse.json({ error: true, msg: "userId required" }, { status: 400 });

    const target = await PlatformUser.findOne({ _id: user._id, orgId: session.user.orgId });
    if (!target) return NextResponse.json({ error: true, msg: "User not found" }, { status: 404 });

    await PlatformUser.findByIdAndUpdate(user._id, { permissions: user.permissions ?? {} });

    const users = await PlatformUser.find({ orgId: session.user.orgId })
        .select("userName firstName lastName email role permissions avatar lastSeen")
        .lean();
    return NextResponse.json({ error: false, users });
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["owner", "admin"].includes(session.user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { userId, role, permissions, isActive } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const target = await PlatformUser.findOne({ _id: userId, orgId: session.user.orgId });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Cannot demote/change the owner's role
    if (target.role === "owner" && role && role !== "owner") {
        return NextResponse.json({ error: "Cannot change owner role" }, { status: 403 });
    }

    const updates = {};
    if (role && ["admin", "operator", "viewer"].includes(role)) updates.role = role;
    if (permissions !== undefined) updates.permissions = permissions;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await PlatformUser.findByIdAndUpdate(userId, updates, { new: true }).select("-password").lean();
    return NextResponse.json({ user: updated });
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    if (!["owner", "admin"].includes(session.user.role))
        return NextResponse.json({ error: true, msg: "Insufficient permissions" }, { status: 403 });

    const url = new URL(req.url);
    const userId = url.searchParams.get("user");
    if (!userId) return NextResponse.json({ error: true, msg: "userId required" }, { status: 400 });

    const target = await PlatformUser.findOne({ _id: userId, orgId: session.user.orgId });
    if (!target) return NextResponse.json({ error: true, msg: "User not found" }, { status: 404 });
    if (target.role === "owner") return NextResponse.json({ error: true, msg: "Cannot delete owner" }, { status: 403 });

    await PlatformUser.findByIdAndDelete(userId);

    const users = await PlatformUser.find({ orgId: session.user.orgId })
        .select("userName firstName lastName email role permissions avatar lastSeen")
        .lean();
    return NextResponse.json({ error: false, users });
}
