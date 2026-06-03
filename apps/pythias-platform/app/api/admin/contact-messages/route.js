import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ContactMessage } from "@pythias/mongo";

export const dynamic = "force-dynamic";

async function guard(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.permissions?.charts) return false;
  return true;
}

export async function GET(req) {
  if (!await guard(req)) return NextResponse.json({ error: true, msg: "Access denied" }, { status: 403 });
  try {
    const messages = await ContactMessage.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ error: false, messages });
  } catch (e) {
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  if (!await guard(req)) return NextResponse.json({ error: true, msg: "Access denied" }, { status: 403 });
  try {
    const { id, read } = await req.json();
    await ContactMessage.findByIdAndUpdate(id, { read });
    return NextResponse.json({ error: false });
  } catch (e) {
    return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
  }
}
