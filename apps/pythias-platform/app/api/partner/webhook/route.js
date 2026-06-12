import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { randomBytes } from "crypto";
import { Organization } from "@pythias/mongo";

// GET — get current webhook config
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const org = await Organization.findById(orgId).select("partnerWebhook").lean();
    const wh  = org?.partnerWebhook ?? {};

    return NextResponse.json({
        url:    wh.url    ?? "",
        active: wh.active ?? false,
        events: wh.events ?? ["order.received", "order.updated", "order.shipped", "order.delivered", "order.cancelled", "product.updated", "design.updated"],
        hasSecret: !!wh.secret,
    });
}

// PUT — update webhook URL / events / active
export async function PUT(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const { url, active, events } = await req.json();

    await Organization.updateOne({ _id: orgId }, {
        $set: {
            "partnerWebhook.url":    url?.trim()   ?? "",
            "partnerWebhook.active": active ?? false,
            "partnerWebhook.events": events ?? ["order.received", "order.updated", "order.shipped", "order.delivered", "order.cancelled", "product.updated", "design.updated"],
        },
    });

    return NextResponse.json({ success: true });
}

// POST — rotate webhook secret (returns new secret ONCE)
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const orgId = session.user.orgId;

    const secret = `whsec_${randomBytes(24).toString("hex")}`;
    await Organization.updateOne({ _id: orgId }, { $set: { "partnerWebhook.secret": secret } });

    return NextResponse.json({ secret });
}
