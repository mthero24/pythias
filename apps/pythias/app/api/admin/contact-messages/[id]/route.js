import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ContactMessage, LeadSequence } from "@pythias/mongo";

async function auth(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    return !!token;
}

export async function GET(req, { params }) {
    if (!await auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
        const { id } = await params;
        const msg = await ContactMessage.findById(id).lean();
        if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const sequence = await LeadSequence.findOne({ email: msg.email?.toLowerCase() }).lean();
        return NextResponse.json({ success: true, message: msg, sequence: sequence ?? null });
    } catch (err) {
        console.error("Contact message GET error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
