import { NextResponse } from "next/server";
import { Settings } from "@pythias/mongo";
import { testSSCredentials } from "@pythias/inventory";

export async function GET() {
    try {
        const [acc, key, conn] = await Promise.all([
            Settings.findOne({ key: "ssactivewear.accountNumber" }).lean(),
            Settings.findOne({ key: "ssactivewear.apiKey" }).lean(),
            Settings.findOne({ key: "ssactivewear.connected" }).lean(),
        ]);
        return NextResponse.json({
            connected:     conn?.value === "true",
            accountNumber: acc?.value  || "",
            hasApiKey:     !!(key?.value),
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { accountNumber, apiKey } = await request.json();
        if (!accountNumber || !apiKey) {
            return NextResponse.json({ error: "Account number and API key are required" }, { status: 400 });
        }

        const ok = await testSSCredentials({ accountNumber, apiKey });
        if (!ok) {
            return NextResponse.json({ error: "Could not connect to S&S Activewear — check your credentials" }, { status: 400 });
        }

        await Promise.all([
            Settings.findOneAndUpdate({ key: "ssactivewear.accountNumber" }, { value: accountNumber }, { upsert: true }),
            Settings.findOneAndUpdate({ key: "ssactivewear.apiKey" },        { value: apiKey },        { upsert: true }),
            Settings.findOneAndUpdate({ key: "ssactivewear.connected" },     { value: "true" },        { upsert: true }),
        ]);

        return NextResponse.json({ ok: true, connected: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await Promise.all([
            Settings.deleteOne({ key: "ssactivewear.accountNumber" }),
            Settings.deleteOne({ key: "ssactivewear.apiKey" }),
            Settings.findOneAndUpdate({ key: "ssactivewear.connected" }, { value: "false" }, { upsert: true }),
        ]);
        return NextResponse.json({ ok: true, connected: false });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
