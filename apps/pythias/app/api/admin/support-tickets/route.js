import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { SupportTicket, Organization } from "@pythias/mongo";

async function auth(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return !!token;
}

export async function GET(req) {
    if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { searchParams } = new URL(req.url);
        const type   = searchParams.get("type");
        const status = searchParams.get("status");
        const orgId  = searchParams.get("orgId");

        const filter = {};
        if (type   && type   !== "all") filter.type   = type;
        if (status && status !== "all") filter.status = status;
        if (orgId)                      filter.orgId  = orgId;

        const tickets = await SupportTicket.find(filter)
            .sort({ createdAt: -1 })
            .select("-messages")
            .lean();

        const orgIds = [...new Set(tickets.map(t => String(t.orgId)))];
        const orgs = await Organization.find({ _id: { $in: orgIds } }).select("_id name slug").lean();
        const orgMap = Object.fromEntries(orgs.map(o => [String(o._id), o]));

        const enriched = tickets.map(t => ({ ...t, org: orgMap[String(t.orgId)] ?? null }));
        return NextResponse.json({ tickets: enriched });
    } catch (e) {
        console.error("[admin/support-tickets GET]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
