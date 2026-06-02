import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PlatformMessage, PlatformGroup, PlatformUser } from "@pythias/mongo";
import mongoose from "mongoose";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const me    = token.userName;
    const orgId = new mongoose.Types.ObjectId(token.orgId);

    const url      = new URL(req.url);
    const withUser = url.searchParams.get("with");
    const groupId  = url.searchParams.get("group");

    if (withUser) {
        const messages = await PlatformMessage.find({
            orgId,
            $or: [
                { from: me, to: withUser },
                { from: withUser, to: me },
            ],
        }).sort({ date: -1 }).limit(60).lean();

        await PlatformMessage.updateMany(
            { orgId, from: withUser, to: me, readBy: { $ne: me } },
            { $addToSet: { readBy: me } }
        );
        return NextResponse.json({ error: false, messages: messages.reverse() });
    }

    if (groupId) {
        const group = await PlatformGroup.findOne({ _id: groupId, orgId }).lean();
        if (!group || !group.members.includes(me))
            return NextResponse.json({ error: true, msg: "Not a member" }, { status: 403 });

        const messages = await PlatformMessage.find({ orgId, group: groupId })
            .sort({ date: -1 }).limit(60).lean();

        await PlatformMessage.updateMany(
            { orgId, group: groupId, from: { $ne: me }, readBy: { $ne: me } },
            { $addToSet: { readBy: me } }
        );
        return NextResponse.json({ error: false, messages: messages.reverse(), group });
    }

    // List conversations
    PlatformUser.findOneAndUpdate({ userName: me, orgId }, { lastSeen: new Date() }).catch(() => {});
    const myGroups = await PlatformGroup.find({ orgId, members: me }).lean();
    const groupIds = myGroups.map(g => g._id.toString());

    const recentMessages = await PlatformMessage.find({
        orgId,
        $or: [{ from: me }, { to: me }, { group: { $in: groupIds } }],
    }).sort({ date: -1 }).limit(500).lean();

    const convMap = new Map();
    for (const msg of recentMessages) {
        if (msg.group) continue;
        const other = msg.from === me ? msg.to : msg.from;
        if (!convMap.has(other)) {
            convMap.set(other, { _id: other, type: "dm", lastMessage: msg.text || (msg.fileName ? `📎 ${msg.fileName}` : ""), lastDate: msg.date, unread: 0 });
        }
        if (msg.to === me && !(msg.readBy ?? []).includes(me)) {
            convMap.get(other).unread++;
        }
    }

    const groupMap = new Map();
    for (const grp of myGroups) {
        const id = grp._id.toString();
        const lastMsg = recentMessages.find(m => m.group === id);
        const unread  = recentMessages.filter(m => m.group === id && m.from !== me && !(m.readBy ?? []).includes(me)).length;
        groupMap.set(id, {
            _id: id, type: "group", name: grp.name, members: grp.members, avatar: grp.avatar,
            lastMessage: lastMsg ? (lastMsg.text || (lastMsg.fileName ? `📎 ${lastMsg.fileName}` : "")) : "",
            lastDate: lastMsg?.date ?? grp.createdAt, unread,
        });
    }

    const conversations = [...convMap.values(), ...groupMap.values()]
        .sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
    const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
    return NextResponse.json({ error: false, conversations, totalUnread });
}

export async function PATCH(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const me    = token.userName;
    const orgId = new mongoose.Types.ObjectId(token.orgId);

    const { messageId, emoji } = await req.json();
    if (!messageId || !emoji) return NextResponse.json({ error: true, msg: "Missing fields" });

    const msg = await PlatformMessage.findOne({ _id: messageId, orgId });
    if (!msg) return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });

    const reactions = msg.reactions ?? {};
    const users = reactions[emoji] ?? [];
    reactions[emoji] = users.includes(me) ? users.filter(u => u !== me) : [...users, me];
    msg.reactions = reactions;
    msg.markModified("reactions");
    await msg.save();
    return NextResponse.json({ error: false, reactions: msg.reactions });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const me    = token.userName;
    const orgId = new mongoose.Types.ObjectId(token.orgId);

    const { to, group, text, fileUrl, fileName, fileType, fileSize } = await req.json();
    if (!to && !group) return NextResponse.json({ error: true, msg: "Missing recipient" });
    if (!text?.trim() && !fileUrl) return NextResponse.json({ error: true, msg: "Empty message" });

    if (group) {
        const grp = await PlatformGroup.findOne({ _id: group, orgId }).lean();
        if (!grp || !grp.members.includes(me))
            return NextResponse.json({ error: true, msg: "Not a member" }, { status: 403 });
    }

    const msg = new PlatformMessage({
        orgId,
        from: me,
        ...(to    && { to }),
        ...(group && { group }),
        text: text?.trim() ?? "",
        ...(fileUrl && { fileUrl, fileName, fileType, fileSize }),
        readBy: [me],
    });
    await msg.save();
    return NextResponse.json({ error: false, message: msg });
}
