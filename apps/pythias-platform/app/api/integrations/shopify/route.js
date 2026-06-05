import { NextResponse } from "next/server";
import { PlatformUser, ApiKeyIntegrations } from "@pythias/mongo";

export async function POST(req) {
    try {
        const data = await req.json();
        const decoded  = Buffer.from(data.Basic, "base64").toString("utf-8");
        const colonIdx = decoded.indexOf(":");
        const email    = decoded.slice(0, colonIdx);
        const password = decoded.slice(colonIdx + 1);

        const user = await PlatformUser.findOne({ $or: [{ email }, { userName: email }] });
        if (!user) return NextResponse.json({ error: true, msg: "Invalid credentials" });

        const valid = await user.comparePassword(password);
        if (!valid) return NextResponse.json({ error: true, msg: "Invalid credentials" });

        await ApiKeyIntegrations.findOneAndUpdate(
            { displayName: `shopify-${data.shop}` },
            { $set: { apiKey: data.pythiasToken, provider: "platform", type: "shopify", orgId: user.orgId ?? null } },
            { upsert: true }
        );

        return NextResponse.json({ error: false, token: user.password });
    } catch (e) {
        console.error("[shopify auth]", e);
        return NextResponse.json({ error: true, msg: "Server error" }, { status: 500 });
    }
}
