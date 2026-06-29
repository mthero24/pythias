import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

const orgQuery = () => ({ slug: process.env.PREMIER_ORG_SLUG || "premier-printing" });
const clean = (arr) => (arr || [])
    .filter((r) => r && String(r.printType || "").trim())
    .map((r) => ({ printType: String(r.printType).trim(), rate: Number(r.rate) || 0 }));

export async function GET(request) {
    const token = await getToken({ req: request });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org = await Organization.findOne(orgQuery()).select("byobDefaultRate byobRatesByType").lean();
    return NextResponse.json({ byobDefaultRate: org?.byobDefaultRate || 0, byobRatesByType: org?.byobRatesByType || [] });
}

export async function PUT(request) {
    const token = await getToken({ req: request });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const byobDefaultRate = Number(body.byobDefaultRate) || 0;
    const byobRatesByType = clean(body.byobRatesByType);
    await Organization.updateOne(orgQuery(), { $set: { byobDefaultRate, byobRatesByType } });
    return NextResponse.json({ ok: true, byobDefaultRate, byobRatesByType });
}
