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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["owner", "admin"].includes(session.user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    try {
        await checkUsage(session.user.orgId, "user");
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 429 });
    }

    const { email, firstName, lastName, password, role } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const exists = await PlatformUser.findOne({ email }).lean();
    if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const user = await PlatformUser.create({
        orgId: session.user.orgId,
        email,
        userName: email,
        password,
        firstName: firstName || "",
        lastName: lastName || "",
        role: ["admin", "operator", "viewer"].includes(role) ? role : "operator",
    });

    await incrementUsage(session.user.orgId, "user");

    const { password: _, ...safeUser } = user.toObject();
    return NextResponse.json({ user: safeUser }, { status: 201 });
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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["owner", "admin"].includes(session.user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const target = await PlatformUser.findOne({ _id: userId, orgId: session.user.orgId });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.role === "owner") return NextResponse.json({ error: "Cannot delete owner" }, { status: 403 });

    await PlatformUser.findByIdAndUpdate(userId, { isActive: false });
    return NextResponse.json({ ok: true });
}
