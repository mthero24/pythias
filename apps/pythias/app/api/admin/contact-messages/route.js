import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ContactMessage } from "@/models/ContactMessage";

async function auth(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return false;
    return true;
}

export async function GET(req) {
    if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const messages = await ContactMessage.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, messages });
    } catch (err) {
        console.error("Contact messages GET error:", err);
        return NextResponse.json({ success: false, error: "Failed to load messages." }, { status: 500 });
    }
}

export async function PATCH(req) {
    if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { id, read } = await req.json();
        await ContactMessage.findByIdAndUpdate(id, { read });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Contact messages PATCH error:", err);
        return NextResponse.json({ success: false, error: "Failed to update message." }, { status: 500 });
    }
}
