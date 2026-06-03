import { NextResponse } from "next/server";
import { SupportTicket } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req, { params }) {
    try {
        const token = await getToken({ req });
        const orgId = token?.orgId;
        if (!orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

        const ticket = await SupportTicket.findOne({ _id: params.id, orgId }).lean();
        if (!ticket) return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });

        return NextResponse.json({ ticket });
    } catch (e) {
        console.error("[support/[id] GET]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const token = await getToken({ req });
        const orgId = token?.orgId;
        if (!orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

        const { body } = await req.json();
        if (!body?.trim()) return NextResponse.json({ error: true, msg: "Reply body required" }, { status: 400 });

        const authorName = [token.firstName, token.lastName].filter(Boolean).join(" ") || token.userName || "User";

        const ticket = await SupportTicket.findOneAndUpdate(
            { _id: params.id, orgId },
            {
                $push: { messages: { body: body.trim(), authorName, authorType: "user" } },
                $set: { status: "open" },
            },
            { new: true }
        ).lean();

        if (!ticket) return NextResponse.json({ error: true, msg: "Not found" }, { status: 404 });
        return NextResponse.json({ ticket });
    } catch (e) {
        console.error("[support/[id] POST]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
