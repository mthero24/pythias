export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { getAuthedCustomer } from "@/lib/account";

// POST /api/app/push-token { token, platform } — store this device's Expo push token on the logged-in
// customer so the store can notify the buyer about order updates. Deduped by token.
export async function POST(req) {
    const auth = await getAuthedCustomer(req).catch(() => null);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token, platform } = await req.json().catch(() => ({}));
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

    // Replace any existing entry for the same token, then add the current one.
    await StorefrontCustomer.updateOne({ _id: auth.customer._id }, { $pull: { pushTokens: { token } } });
    await StorefrontCustomer.updateOne(
        { _id: auth.customer._id },
        { $push: { pushTokens: { token, platform: platform || "", updatedAt: new Date() } } }
    );
    return NextResponse.json({ ok: true });
}
