import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";

// Premier is single-org: its storefront org is the "premier-printing" Organization (the same
// provider org registered in the pythias DB). Cached after first lookup.
let _orgId;
export async function premierOrgId() {
    if (_orgId !== undefined) return _orgId;
    const org = await Organization.findOne({ slug: "premier-printing" }).select("_id").lean();
    _orgId = org?._id ? String(org._id) : null;
    return _orgId;
}

// Resolve the authed Premier user's storefront orgId, or null if not signed in / org missing.
export async function premierAuthedOrg(req) {
    const token = await getToken({ req });
    if (!token?.userName) return null;
    return premierOrgId();
}
export async function premierUser(req) {
    const token = await getToken({ req });
    return token?.userName || null;
}
export function svcError(e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: e?.status || 500 });
}
