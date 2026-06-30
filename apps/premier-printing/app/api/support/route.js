import { NextResponse } from "next/server";
import { SupportTicket } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { getPremierOrgId } from "@/lib/premierOrg";

// Ticket numbers are GLOBALLY unique (the index is not per-org), so number from the global max.
// A per-org count collides across orgs — two orgs' first tickets would both be TK-0001.
async function nextTicketNumber() {
    const last = await SupportTicket.findOne({}).sort({ ticketNumber: -1 }).select("ticketNumber").lean();
    const num = last ? (parseInt(last.ticketNumber.replace("TK-", ""), 10) || 0) : 0;
    return `TK-${String(num + 1).padStart(4, "0")}`;
}

export async function GET(req) {
    try {
        const token = await getToken({ req });
        if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

        const orgId = await getPremierOrgId();
        if (!orgId) return NextResponse.json({ error: true, msg: "Premier org not found" }, { status: 500 });

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
        if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

        const orgId = await getPremierOrgId();
        if (!orgId) return NextResponse.json({ error: true, msg: "Premier org not found" }, { status: 500 });

        const { subject, type, priority, description } = await req.json();
        if (!subject?.trim() || !["request", "issue"].includes(type) || !description?.trim()) {
            return NextResponse.json({ error: true, msg: "Subject, type, and description are required" }, { status: 400 });
        }

        const authorName = [token.firstName, token.lastName].filter(Boolean).join(" ") || token.userName || "User";

        // Retry on a duplicate ticketNumber (concurrent creates racing for the same next number).
        let ticket;
        for (let attempt = 0; ; attempt++) {
            try {
                ticket = await SupportTicket.create({
                    orgId,
                    ticketNumber: await nextTicketNumber(),
                    subject: subject.trim(),
                    type,
                    priority: priority || "normal",
                    status: "open",
                    createdByUserId: token.id || token.sub,
                    createdByName: authorName,
                    messages: [{ body: description.trim(), authorName, authorType: "user" }],
                });
                break;
            } catch (e) {
                if (e?.code === 11000 && attempt < 5) continue;
                throw e;
            }
        }

        return NextResponse.json({ ticket });
    } catch (e) {
        console.error("[support POST]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
