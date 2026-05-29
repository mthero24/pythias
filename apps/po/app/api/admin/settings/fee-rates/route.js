import { NextResponse } from "next/server";
import { Settings } from "@pythias/mongo";

export async function GET() {
    try {
        const doc = await Settings.findOne({ key: "feeRates:po" }).lean();
        return NextResponse.json({ value: doc?.value ?? null });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const { value } = await req.json();
        await Settings.findOneAndUpdate(
            { key: "feeRates:po" },
            { $set: { value } },
            { upsert: true, new: true }
        );
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
