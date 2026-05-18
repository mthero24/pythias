import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Group } from "@pythias/mongo";

export async function GET(req) {
    const token = await getToken({ req });
    const me = token?.userName ?? token?.email;
    if (!me) return NextResponse.json({ error: true }, { status: 401 });
    const groups = await Group.find({ members: me }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ error: false, groups });
}

export async function POST(req) {
    const token = await getToken({ req });
    const me = token?.userName ?? token?.email;
    if (!me) return NextResponse.json({ error: true }, { status: 401 });
    const { name, members, avatar } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: true, msg: "Name required" });
    const all = [...new Set([me, ...(members ?? [])])];
    const group = new Group({ name: name.trim(), members: all, createdBy: me, avatar: avatar ?? "#6366f1" });
    await group.save();
    return NextResponse.json({ error: false, group });
}

export async function PUT(req) {
    const token = await getToken({ req });
    const me = token?.userName ?? token?.email;
    if (!me) return NextResponse.json({ error: true }, { status: 401 });
    const { groupId, action, member, name } = await req.json();
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(me))
        return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });

    if (action === "add"    && member && !group.members.includes(member)) group.members.push(member);
    if (action === "remove" && member) group.members = group.members.filter(m => m !== member);
    if (action === "rename" && name?.trim()) group.name = name.trim();
    if (action === "leave")  group.members = group.members.filter(m => m !== me);

    await group.save();
    return NextResponse.json({ error: false, group });
}
