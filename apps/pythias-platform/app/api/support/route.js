import { NextResponse } from "next/server";
import { SupportTicket, Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

async function nextTicketNumber(orgId) {
    const last = await SupportTicket.findOne({ orgId }).sort({ createdAt: -1 }).select("ticketNumber").lean();
    if (!last) return "TK-0001";
    const num = parseInt(last.ticketNumber.replace("TK-", ""), 10) || 0;
    return `TK-${String(num + 1).padStart(4, "0")}`;
}

export async function GET(req) {
    try {
        const token = await getToken({ req });
        const orgId = token?.orgId;
        if (!orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type   = searchParams.get("type");
        const status = searchParams.get("status");

        const filter = { orgId };
        if (type   && type   !== "all") filter.type   = type;
        if (status && status !== "all") filter.status = status;

        const tickets = await SupportTicket.find(filter)
            .sort({ createdAt: -1 })
            .select("-messages")
            .lean();

        return NextResponse.json({ tickets });
    } catch (e) {
        console.error("[support GET]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const token = await getToken({ req });
        const orgId = token?.orgId;
        if (!orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

        const { subject, type, priority, description } = await req.json();
        if (!subject?.trim() || !["request", "issue"].includes(type) || !description?.trim()) {
            return NextResponse.json({ error: true, msg: "Subject, type, and description are required" }, { status: 400 });
        }

        const ticketNumber = await nextTicketNumber(orgId);
        const authorName = [token.firstName, token.lastName].filter(Boolean).join(" ") || token.userName || "User";

        const ticket = await SupportTicket.create({
            orgId,
            ticketNumber,
            subject: subject.trim(),
            type,
            priority: priority || "normal",
            status: "open",
            createdByUserId: token.id || token.sub,
            createdByName: authorName,
            messages: [{ body: description.trim(), authorName, authorType: "user" }],
        });

        return NextResponse.json({ ticket });
    } catch (e) {
        console.error("[support POST]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
