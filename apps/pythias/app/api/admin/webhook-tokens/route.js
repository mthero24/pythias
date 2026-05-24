export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { WebhookToken } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import { randomBytes } from "crypto";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const tokens = await WebhookToken.find().sort({ createdAt: -1 }).lean();
    // Mask token — only show last 6 chars
    const masked = tokens.map((t) => ({
        ...t,
        token: "••••••••••••••••••••••••••" + t.token.slice(-6),
    }));
    return NextResponse.json({ tokens: masked });
}

export async function POST(req) {
    const authToken = await getToken({ req });
    if (!authToken) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { name, type } = await req.json();
    if (!name) return NextResponse.json({ error: true, msg: "Name is required" }, { status: 400 });

    const rawToken = randomBytes(32).toString("hex");
    const record = await WebhookToken.create({
        name,
        token: rawToken,
        type: type || "articles",
        createdBy: authToken.userName || "",
    });

    // Return the full token ONCE — never shown again
    return NextResponse.json({ error: false, token: rawToken, _id: record._id, name: record.name, type: record.type });
}

export async function DELETE(req) {
    const authToken = await getToken({ req });
    if (!authToken) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await WebhookToken.findByIdAndUpdate(id, { active: false });
    return NextResponse.json({ error: false });
}
