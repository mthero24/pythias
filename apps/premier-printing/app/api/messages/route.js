import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Message } from "@pythias/mongo";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const me = token.userName;

    const url = new URL(req.url);
    const withUser = url.searchParams.get("with");

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

    const conversations = await Message.aggregate([
        { $match: { $or: [{ from: me }, { to: me }] } },
        {
            $addFields: {
                otherUser: { $cond: [{ $eq: ["$from", me] }, "$to", "$from"] },
                isUnread: {
                    $and: [
                        { $eq: ["$to", me] },
                        { $not: [{ $in: [me, "$readBy"] }] },
                    ],
                },
            },
        },
        { $sort: { date: -1 } },
        {
            $group: {
                _id: "$otherUser",
                lastMessage: { $first: "$text" },
                lastDate: { $first: "$date" },
                unread: { $sum: { $cond: ["$isUnread", 1, 0] } },
            },
        },
        { $sort: { lastDate: -1 } },
    ]);

    const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
    return NextResponse.json({ error: false, conversations, totalUnread });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.userName) return NextResponse.json({ error: true }, { status: 401 });
    const me = token.userName;
    const { to, text } = await req.json();
    if (!to || !text?.trim()) return NextResponse.json({ error: true, msg: "Missing to or text" });
    const msg = new Message({ from: me, to, text: text.trim(), readBy: [me] });
    await msg.save();
    return NextResponse.json({ error: false, message: msg });
}
