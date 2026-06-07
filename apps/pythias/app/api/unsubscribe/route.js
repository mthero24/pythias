import { NextResponse } from "next/server";
import { LeadSequence } from "@pythias/mongo";

export async function GET(req) {
    const email = new URL(req.url).searchParams.get("email");
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    await LeadSequence.findOneAndUpdate(
        { email: email.toLowerCase() },
        { $set: { unsubscribed: true, paused: false } },
        { upsert: true }
    );

    return NextResponse.redirect(new URL("/unsubscribe?done=1", req.url));
}
