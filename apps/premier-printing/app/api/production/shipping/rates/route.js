import { NextApiRequest, NextResponse } from "next/server";
import { getRates } from "@pythias/shipping";
import { getShippingCreds } from "@/lib/getShippingCreds";

export async function POST(req = NextApiRequest) {
    let data = await req.json();
    if (!data.address.country) data.address.country = "US";
    if (data.packages?.length > 0) {
        data.weight = data.packages.reduce((s, p) => s + p.weight, 0);
        data.dimensions = data.packages[0].dimensions;
    }
    const sc = await getShippingCreds();
    try {
        const rates = await getRates({
            address: data.address,
            businessAddress: sc.businessAddress,
            type: data.marketplace == "faire" ? null : data.marketplace == "Zulily" || data.marketplace == "TSC" ? "Expedited" : "Standard",
            providers: ["usps", "ups"],
            weight: data.weight,
            dimensions: data.dimensions,
            enSettings: sc.enSettings,
            credentials: sc.credentials,
            credentialsFedEx: sc.credentialsFedEx,
            credentialsFedExNew: sc.credentialsFedExNew,
            credentialsUPS: sc.credentialsUPS,
            credentialsShipStation: sc.credentialsShipStation,
            credentialsDHL: sc.credentialsDHL,
            carrierCodes: sc.carrierCodes,
            warehouse_id: sc.warehouse_id,
        });
        return NextResponse.json({ error: false, rates: rates ?? [] });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: e });
    }
}
