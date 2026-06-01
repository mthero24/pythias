import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Settings } from "@pythias/mongo";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: true }, { status: 401 });
        const key = `feeRates:platform:${session.user.orgId}`;
        const doc = await Settings.findOne({ key }).lean();
        return NextResponse.json({ value: doc?.value ?? null });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: true }, { status: 401 });
        const key = `feeRates:platform:${session.user.orgId}`;
        const { value } = await req.json();
        await Settings.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true });
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
