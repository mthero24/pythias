import { NextResponse } from "next/server";
import { validateAddress } from "@pythias/shipping";
import { getToken } from "next-auth/jwt";
import { getOrgCreds, buildShippingCreds } from "@/lib/getOrgCreds";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const creds = await getOrgCreds(token.orgId);
    const sc = buildShippingCreds(creds);

    try {
        const result = await validateAddress({ address: data.address, credentials: sc.credentials });
        return NextResponse.json({ error: false, ...result });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message });
    }
}
