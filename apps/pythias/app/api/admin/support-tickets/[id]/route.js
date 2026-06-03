import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { SupportTicket } from "@pythias/mongo";

async function auth(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return token || null;
}

export async function GET(req, { params }) {
    if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const ticket = await SupportTicket.findById(params.id).lean();
        if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ ticket });
    } catch (e) {
        console.error("[admin/support-tickets/[id] GET]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    const token = await auth(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { status, reply } = await req.json();

        const mongoUpdate = {};

        if (status) {
            mongoUpdate.$set = { status };
        }

        if (reply?.trim()) {
            const authorName = [token.firstName, token.lastName].filter(Boolean).join(" ") || token.userName || "Pythias Support";
            mongoUpdate.$push = { messages: { body: reply.trim(), authorName, authorType: "staff" } };
        }

        if (!mongoUpdate.$set && !mongoUpdate.$push) {
            return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
        }

        const ticket = await SupportTicket.findByIdAndUpdate(params.id, mongoUpdate, { new: true }).lean();
        if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ ticket });
    } catch (e) {
        console.error("[admin/support-tickets/[id] PATCH]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
