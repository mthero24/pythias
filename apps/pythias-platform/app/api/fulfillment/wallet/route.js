export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Organization } from "@pythias/mongo";

// GET /api/fulfillment/wallet — return current wallet state
export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const org = await Organization.findById(session.user.orgId, "wallet orgType").lean();
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });
    if (org.orgType !== "commerce") return NextResponse.json({ error: "Not a Commerce Cloud org" }, { status: 403 });

    return NextResponse.json({ error: false, wallet: org.wallet ?? {} });
}

// POST /api/fulfillment/wallet
// Body: { action: "add-funds", amountCents: number }
//       { action: "update-settings", minimumBalance: number, autoRechargeAmount: number, autoRechargeEnabled: boolean }
export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const org = await Organization.findById(session.user.orgId, "wallet orgType").lean();
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });
    if (org.orgType !== "commerce") return NextResponse.json({ error: "Not a Commerce Cloud org" }, { status: 403 });

    const body = await req.json();

    if (body.action === "add-funds") {
        const amount = Math.round(Number(body.amountCents));
        if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

        // In production this would process a Stripe charge first.
        // For now we accept the amount and credit the wallet directly.
        await Organization.updateOne(
            { _id: org._id ?? session.user.orgId },
            { $inc: { "wallet.balance": amount }, $set: { "wallet.lastRechargedAt": new Date() } }
        );
        const updated = await Organization.findById(session.user.orgId, "wallet").lean();
        return NextResponse.json({ error: false, wallet: updated.wallet });
    }

    if (body.action === "update-settings") {
        const update = {};
        if (body.minimumBalance     != null) update["wallet.minimumBalance"]      = Math.round(Number(body.minimumBalance));
        if (body.autoRechargeAmount != null) update["wallet.autoRechargeAmount"]  = Math.round(Number(body.autoRechargeAmount));
        if (body.autoRechargeEnabled != null) update["wallet.autoRechargeEnabled"] = Boolean(body.autoRechargeEnabled);

        await Organization.updateOne({ _id: session.user.orgId }, { $set: update });
        const updated = await Organization.findById(session.user.orgId, "wallet").lean();
        return NextResponse.json({ error: false, wallet: updated.wallet });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
