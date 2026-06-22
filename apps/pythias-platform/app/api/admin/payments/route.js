import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PaymentReceived, Organization } from "@pythias/mongo";

// Super-admin only — record/list/delete MANUAL payments (money received outside Stripe:
// invoice / ACH / check). These land in the same PaymentReceived ledger as Stripe payments,
// so they flow into company finance (/admin) and the seller's Reports "Platform Cost".
function isAdmin(session) {
    if (!session?.user?.email) return false;
    const admins = (process.env.PYTHIAS_ADMIN_EMAILS ?? "").split(",").map(e => e.trim());
    return admins.includes(session.user.email);
}

const TYPES = ["subscription", "overage", "kling", "onboarding", "wallet", "other"];

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => null);
    const orgId = body?.orgId;
    const amount = Number(body?.amount);   // dollars
    if (!orgId || !amount || amount <= 0) {
        return NextResponse.json({ error: "orgId and a positive amount are required" }, { status: 400 });
    }
    const org = await Organization.findById(orgId).select("_id name").lean();
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const type = TYPES.includes(body.type) ? body.type : "other";
    const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
    const period = paidAt.toISOString().slice(0, 7);

    const doc = await PaymentReceived.create({
        orgId,
        amountCents: Math.round(amount * 100),
        currency: "usd",
        type,
        period,
        description: (body.description || "Manual payment").slice(0, 300),
        paidAt,
        manual: true,
        recordedBy: session.user.email,
    });
    return NextResponse.json({ success: true, id: doc._id.toString() }, { status: 201 });
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [payments, orgs] = await Promise.all([
        PaymentReceived.find({ manual: true }).sort({ paidAt: -1 }).limit(100).lean(),
        Organization.find({}).select("name slug").lean(),
    ]);
    const orgMap = Object.fromEntries(orgs.map(o => [String(o._id), o.name || o.slug]));
    return NextResponse.json({
        payments: payments.map(p => ({
            id: String(p._id), orgId: String(p.orgId), orgName: orgMap[String(p.orgId)] || "—",
            amount: (p.amountCents || 0) / 100, type: p.type, description: p.description,
            paidAt: p.paidAt, recordedBy: p.recordedBy,
        })),
    });
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await req.json().catch(() => ({}));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    // Only manual entries can be deleted here — never touch Stripe-sourced records.
    await PaymentReceived.deleteOne({ _id: id, manual: true });
    return NextResponse.json({ success: true });
}
