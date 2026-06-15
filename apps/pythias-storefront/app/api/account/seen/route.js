export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

// POST /api/account/seen — lightweight presence beacon (updates lastSeenAt) so the lifecycle
// job can tell who's been browsing. No-op for guests.
export async function POST(req) {
    const auth = await getAuthedCustomer(req).catch(() => null);
    if (auth) await StorefrontCustomer.updateOne({ _id: auth.customer._id }, { $set: { lastSeenAt: new Date() } });
    return NextResponse.json({ ok: true });
}
