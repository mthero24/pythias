import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformOrder } from "@pythias/mongo";
import { cjBalance } from "@pythias/backend/server";

export const dynamic = "force-dynamic";

// Super-admin only — CJ dropship settlement view: live CJ account balance + the dropship orders we've
// placed (so we know how much to fund CJ and can reconcile). Money is collected from sellers' wallets
// at order time; this is the Pythias → CJ side.
function isAdmin(session) {
    if (!session?.user?.email) return false;
    const admins = (process.env.PYTHIAS_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
    return admins.includes(session.user.email);
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let balance = null, balanceError = null;
    try { balance = await cjBalance(); }
    catch (e) { balanceError = e.message || "Couldn't read CJ balance"; }

    const docs = await PlatformOrder.find({ "fulfillmentGroups.handler": "cj" })
        .sort({ _id: -1 }).limit(150)
        .select("poNumber fulfillmentGroups date orgId").lean();

    const orders = [];
    let totalCents = 0, orderedCount = 0;
    for (const o of docs) {
        for (const g of (o.fulfillmentGroups || [])) {
            if (g.handler !== "cj") continue;
            const billed = Number(g.billedCents) || 0;
            totalCents += billed;
            if (g.status === "ordered") orderedCount++;
            orders.push({
                poNumber: o.poNumber || String(o._id),
                cjOrderId: g.ref || "",
                amount: billed / 100,
                status: g.status || "",
                items: g.itemCount || 0,
                date: o.date || null,
            });
        }
    }

    return NextResponse.json({
        balance: balance ? { amount: balance.amountCents / 100, freeze: balance.freezeCents / 100 } : null,
        balanceError,
        orders,
        totals: { count: orders.length, ordered: orderedCount, billed: totalCents / 100 },
    });
}
