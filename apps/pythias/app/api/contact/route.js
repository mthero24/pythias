import { NextResponse } from "next/server";
import { ContactMessage } from "@pythias/mongo";

export async function POST(req) {
    try {
        const { name, company, phone, email, message } = await req.json();
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
            return NextResponse.json({ success: false, error: "Name, email, and message are required." }, { status: 400 });
        }
        await ContactMessage.create({ name, company, phone, email, message });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Contact POST error:", err);
        return NextResponse.json({ success: false, error: "Failed to send message." }, { status: 500 });
    }
}
