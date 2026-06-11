import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { OrgIntegrations } from "@pythias/mongo";
import { testSSCredentials } from "@pythias/inventory";

async function getOrgId(req) {
    const token = await getToken({ req });
    return token?.orgId || token?.org;
}

export async function GET(request) {
    try {
        const orgId = await getOrgId(request);
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const doc = await OrgIntegrations.findOne({ orgId }).select("ssactivewear").lean();
        return NextResponse.json({
            connected:     doc?.ssactivewear?.connected    || false,
            accountNumber: doc?.ssactivewear?.accountNumber || "",
            hasApiKey:     !!(doc?.ssactivewear?.apiKey),
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const orgId = await getOrgId(request);
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { accountNumber, apiKey } = await request.json();
        if (!accountNumber || !apiKey) {
            return NextResponse.json({ error: "Account number and API key are required" }, { status: 400 });
        }

        const ok = await testSSCredentials({ accountNumber, apiKey });
        if (!ok) {
            return NextResponse.json({ error: "Could not connect to S&S Activewear — check your credentials" }, { status: 400 });
        }

        await OrgIntegrations.findOneAndUpdate(
            { orgId },
            { $set: { "ssactivewear.accountNumber": accountNumber, "ssactivewear.apiKey": apiKey, "ssactivewear.connected": true } },
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
            { $set: { "ssactivewear.accountNumber": "", "ssactivewear.apiKey": "", "ssactivewear.connected": false } }
        );

        return NextResponse.json({ ok: true, connected: false });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
