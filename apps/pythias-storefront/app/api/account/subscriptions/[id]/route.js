export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { StorefrontSubscription } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

// POST /api/account/subscriptions/[id] — buyer self-service. Body: { action: pause|resume|cancel|skip }
export async function POST(req, { params }) {
    const auth = await getAuthedCustomer(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sub = await StorefrontSubscription.findOne({ _id: id, orgId: auth.orgId, customerId: auth.customer._id });
    if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    if (sub.status === "canceled") return NextResponse.json({ error: "Subscription is canceled" }, { status: 400 });

    const action = (await req.json().catch(() => ({}))).action;
    if (action === "pause") sub.status = "paused";
    else if (action === "resume") { sub.status = "active"; if (!sub.nextBillingAt || sub.nextBillingAt < new Date()) sub.nextBillingAt = new Date(Date.now() + sub.intervalDays * 864e5); }
    else if (action === "cancel") sub.status = "canceled";
    else if (action === "skip") sub.nextBillingAt = new Date((sub.nextBillingAt?.getTime() || Date.now()) + sub.intervalDays * 864e5);
    else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    await sub.save();
    return NextResponse.json({ error: false, status: sub.status, nextBillingAt: sub.nextBillingAt });
}
