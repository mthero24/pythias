import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { OrgIntegrations } from "@pythias/mongo";
import { getProductInfoByStyleColorSize } from "@pythias/inventory";

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

async function getOrgId(req) {
    const token = await getToken({ req });
    return token?.orgId || token?.org;
}

export async function GET(request) {
    try {
        const orgId = await getOrgId(request);
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const doc = await OrgIntegrations.findOne({ orgId }).select("sanmar").lean();
        return NextResponse.json({
            connected:      doc?.sanmar?.connected || false,
            customerNumber: doc?.sanmar?.customerNumber || "",
            userName:       doc?.sanmar?.userName || "",
            hasPassword:    !!(doc?.sanmar?.password),
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const orgId = await getOrgId(request);
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { customerNumber, userName, password } = await request.json();
        if (!customerNumber || !userName || !password) {
            return NextResponse.json({ error: "All three credentials are required" }, { status: 400 });
        }

        const ok = await testCredentials(customerNumber, userName, password);
        if (!ok) {
            return NextResponse.json({ error: "Could not connect to SanMar — check your credentials" }, { status: 400 });
        }

        await OrgIntegrations.findOneAndUpdate(
            { orgId },
            { $set: { "sanmar.customerNumber": customerNumber, "sanmar.userName": userName, "sanmar.password": password, "sanmar.connected": true } },
            { upsert: true }
        );

        return NextResponse.json({ ok: true, connected: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const orgId = await getOrgId(request);
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await OrgIntegrations.findOneAndUpdate(
            { orgId },
            { $set: { "sanmar.customerNumber": "", "sanmar.userName": "", "sanmar.password": "", "sanmar.connected": false } }
        );

        return NextResponse.json({ ok: true, connected: false });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
