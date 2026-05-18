import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Message, Group } from "@pythias/mongo";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const me = token.userName;

    const url      = new URL(req.url);
    const withUser = url.searchParams.get("with");
    const groupId  = url.searchParams.get("group");
    const search   = url.searchParams.get("search");

    // — fetch messages in a DM thread —
    if (withUser) {
        const messages = await Message.find({
            $or: [
                { from: me, to: withUser },
                { from: withUser, to: me },
            ],
        }).sort({ date: -1 }).limit(60).lean();

        await Message.updateMany(
            { from: withUser, to: me, readBy: { $ne: me } },
            { $addToSet: { readBy: me } }
        );
        return NextResponse.json({ error: false, messages: messages.reverse() });
    }

    // — fetch messages in a group thread —
    if (groupId) {
        const group = await Group.findById(groupId).lean();
        if (!group || !group.members.includes(me))
            return NextResponse.json({ error: true, msg: "Not a member" }, { status: 403 });

        const messages = await Message.find({ group: groupId })
            .sort({ date: -1 }).limit(60).lean();

        await Message.updateMany(
            { group: groupId, from: { $ne: me }, readBy: { $ne: me } },
            { $addToSet: { readBy: me } }
        );
        return NextResponse.json({ error: false, messages: messages.reverse(), group });
    }

    // — search across all conversations —
    if (search && search.trim()) {
        const q = search.trim();
        const myGroups = await Group.find({ members: me }).lean();
        const groupIds = myGroups.map(g => g._id.toString());
        const results = await Message.find({
            $and: [
                { $or: [
                    { from: me },
                    { to: me },
                    { group: { $in: groupIds } },
                ]},
                { $or: [
                    { text: { $regex: q, $options: "i" } },
                    { fileName: { $regex: q, $options: "i" } },
                ]},
            ],
        }).sort({ date: -1 }).limit(50).lean();
        return NextResponse.json({ error: false, results });
    }

    // — list conversations (DMs + groups) —
    const myGroups = await Group.find({ members: me }).lean();
    const groupIds = myGroups.map(g => g._id.toString());

    const recentMessages = await Message.find({
        $or: [{ from: me }, { to: me }, { group: { $in: groupIds } }],
    }).sort({ date: -1 }).limit(500).lean();

    // Build DM conversation map
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

    // Build group conversation map
    const groupMap = new Map();
    for (const grp of myGroups) {
        const id = grp._id.toString();
        const lastMsg = recentMessages.find(m => m.group === id);
        const unread = recentMessages.filter(m => m.group === id && m.from !== me && !(m.readBy ?? []).includes(me)).length;
        groupMap.set(id, {
            _id: id,
            type: "group",
            name: grp.name,
            members: grp.members,
            avatar: grp.avatar,
            lastMessage: lastMsg ? (lastMsg.text || (lastMsg.fileName ? `📎 ${lastMsg.fileName}` : "")) : "",
            lastDate: lastMsg?.date ?? grp.createdAt,
            unread,
        });
    }

    const conversations = [...convMap.values(), ...groupMap.values()]
        .sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
    const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
    return NextResponse.json({ error: false, conversations, totalUnread });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const me = token.userName;

    const body = await req.json();
    const { to, group, text, fileUrl, fileName, fileType, fileSize } = body;

    if (!to && !group) return NextResponse.json({ error: true, msg: "Missing recipient" });
    if (!text?.trim() && !fileUrl) return NextResponse.json({ error: true, msg: "Empty message" });

    if (group) {
        const grp = await Group.findById(group).lean();
        if (!grp || !grp.members.includes(me))
            return NextResponse.json({ error: true, msg: "Not a member" }, { status: 403 });
    }

    const msg = new Message({
        from: me,
        ...(to    && { to }),
        ...(group  && { group }),
        text: text?.trim() ?? "",
        ...(fileUrl  && { fileUrl, fileName, fileType, fileSize }),
        readBy: [me],
    });
    await msg.save();
    return NextResponse.json({ error: false, message: msg });
}
