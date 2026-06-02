import { NextResponse } from "next/server";
import { getRates } from "@pythias/shipping";
import { getToken } from "next-auth/jwt";
import { getOrgCreds, buildShippingCreds } from "@/lib/getOrgCreds";

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    if (!data.address?.country) data.address.country = "US";

    const creds = await getOrgCreds(token.orgId);
    const sc = buildShippingCreds(creds);
    if (data.packages?.length > 0) {
        data.weight = data.packages.reduce((s, p) => s + p.weight, 0);
        data.dimensions = data.packages[0].dimensions;
    }

    try {
        const rates = await getRates({
            address: data.address,
            businessAddress: sc.businessAddress,
            type: data.marketplace === "faire" ? null : "Standard",
            providers: ["usps", "ups"],
            weight: data.weight,
            dimensions: data.dimensions,
            enSettings: sc.enSettings,
            credentials: sc.credentials,
            credentialsUPS: sc.credentialsUPS,
            credentialsFedEx: sc.credentialsFedEx,
            credentialsShipStation: { apiKey: sc.ssV2 },
        });
        return NextResponse.json({ error: false, rates: rates ?? [] });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: true, msg: e.message });
    }
}
