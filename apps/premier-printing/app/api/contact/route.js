import { NextResponse } from "next/server";
import { ContactMessage } from "@pythias/mongo";

export async function POST(req) {
  try {
    const { name, company, phone, email, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: true, msg: "Name, email, and message are required." }, { status: 400 });
    }
    await ContactMessage.create({ name, company, phone, email, message, source: "premier-printing" });
    return NextResponse.json({ error: false });
  } catch (e) {
    console.error("[contact POST]", e);
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}
