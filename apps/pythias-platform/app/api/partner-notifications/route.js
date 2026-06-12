import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ApiNotification } from "@pythias/mongo";

// GET /api/partner-notifications?filter=unread&page=1  — list notifications for the org
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const { searchParams } = new URL(req.url);
    const filter   = searchParams.get("filter"); // "unread" | undefined
    const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = 25;

    const query = { orgId };
    if (filter === "unread") query.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
        ApiNotification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        ApiNotification.countDocuments(query),
        ApiNotification.countDocuments({ orgId, read: false }),
    ]);

    return NextResponse.json({
        notifications: notifications.map((n) => ({
            id:        n._id.toString(),
            level:     n.level,
            source:    n.source,
            event:     n.event ?? null,
            title:     n.title,
            message:   n.message ?? null,
            detail:    n.detail ?? null,
            read:      n.read,
            createdAt: n.createdAt,
        })),
        total,
        unreadCount,
        page,
        pages: Math.ceil(total / pageSize),
    });
}

// PATCH /api/partner-notifications  — mark read
// Body: { id } to mark one, or { all: true } to mark all read
export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const { id, all } = await req.json().catch(() => ({}));
    if (all) {
        await ApiNotification.updateMany({ orgId, read: false }, { read: true });
    } else if (id) {
        await ApiNotification.updateOne({ _id: id, orgId }, { read: true });
    } else {
        return NextResponse.json({ error: "Provide id or all:true" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
}

// DELETE /api/partner-notifications?id=...  — dismiss a notification
export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await ApiNotification.deleteOne({ _id: id, orgId });
    return NextResponse.json({ success: true });
}
