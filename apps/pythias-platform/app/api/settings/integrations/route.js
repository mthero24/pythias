import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { OrgIntegrations } from "@pythias/mongo";
import { clearCredsCache } from "@/lib/getOrgCreds";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const creds = await OrgIntegrations.findOne({ orgId: session.user.orgId }).lean();
    return NextResponse.json({ creds: creds ?? {} });
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ['owner', 'admin'];
    if (!allowed.includes(session.user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();

    await OrgIntegrations.findOneAndUpdate(
        { orgId: session.user.orgId },
        { $set: flattenForUpdate(body) },
        { upsert: true }
    );

    clearCredsCache(session.user.orgId);

    return NextResponse.json({ ok: true });
}

// Converts { shipstation: { apiKey: "x" } } → { "shipstation.apiKey": "x" }
function flattenForUpdate(obj, prefix = "") {
    const out = {};
    for (const [k, v] of Object.entries(obj ?? {})) {
        const path = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) {
            Object.assign(out, flattenForUpdate(v, path));
        } else {
            out[path] = v;
        }
    }
    return out;
}
