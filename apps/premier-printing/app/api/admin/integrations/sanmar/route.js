import { NextResponse } from "next/server";
import { Settings } from "@pythias/mongo";
import { getProductInfoByStyleColorSize } from "@pythias/inventory";

// Test connection by fetching a known style
async function testCredentials(customerNumber, userName, password) {
    const origAccount  = process.env.sanmarAccount;
    const origUser     = process.env.sanmarUserName;
    const origPassword = process.env.sanmarPassword;
    process.env.sanmarAccount  = customerNumber;
    process.env.sanmarUserName = userName;
    process.env.sanmarPassword = password;
    try {
        const result = await getProductInfoByStyleColorSize("PC61", "", "");
        return !result.error;
    } catch {
        return false;
    } finally {
        process.env.sanmarAccount  = origAccount;
        process.env.sanmarUserName = origUser;
        process.env.sanmarPassword = origPassword;
    }
}

export async function GET() {
    try {
        const [cn, un, pw, conn] = await Promise.all([
            Settings.findOne({ key: "sanmar.customerNumber" }).lean(),
            Settings.findOne({ key: "sanmar.userName" }).lean(),
            Settings.findOne({ key: "sanmar.password" }).lean(),
            Settings.findOne({ key: "sanmar.connected" }).lean(),
        ]);
        return NextResponse.json({
            connected:      conn?.value === "true",
            customerNumber: cn?.value  || "",
            userName:       un?.value  || "",
            hasPassword:    !!(pw?.value),
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { customerNumber, userName, password } = await request.json();
        if (!customerNumber || !userName || !password) {
            return NextResponse.json({ error: "All three credentials are required" }, { status: 400 });
        }

        const ok = await testCredentials(customerNumber, userName, password);
        if (!ok) {
            return NextResponse.json({ error: "Could not connect to SanMar — check your credentials" }, { status: 400 });
        }

        await Promise.all([
            Settings.findOneAndUpdate({ key: "sanmar.customerNumber" }, { value: customerNumber }, { upsert: true }),
            Settings.findOneAndUpdate({ key: "sanmar.userName" },       { value: userName },       { upsert: true }),
            Settings.findOneAndUpdate({ key: "sanmar.password" },       { value: password },       { upsert: true }),
            Settings.findOneAndUpdate({ key: "sanmar.connected" },      { value: "true" },         { upsert: true }),
        ]);

        return NextResponse.json({ ok: true, connected: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await Promise.all([
            Settings.deleteOne({ key: "sanmar.customerNumber" }),
            Settings.deleteOne({ key: "sanmar.userName" }),
            Settings.deleteOne({ key: "sanmar.password" }),
            Settings.findOneAndUpdate({ key: "sanmar.connected" }, { value: "false" }, { upsert: true }),
        ]);
        return NextResponse.json({ ok: true, connected: false });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
