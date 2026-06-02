import { NextApiRequest, NextResponse } from "next/server";
import { getRates } from "@pythias/shipping";
import Order from "../../../../../models/Order";
import User from "../../../../../models/User";
import { getShippingCreds } from "@/lib/getShippingCreds";

export async function POST(req = NextApiRequest) {
    let data = await req.json();
    if (!data.address.country) data.address.country = "US";
    if (data.packages?.length > 0) {
        data.weight = data.packages.reduce((s, p) => s + p.weight, 0);
        data.dimensions = data.packages[0].dimensions;
    }

    const sc = await getShippingCreds();
    let businessAddress = sc.businessAddress;

    if (data.orderId) {
        try {
            const order = await Order.findById(data.orderId).select("userName").lean();
            if (order?.userName) {
                const user = await User.findOne({ userName: order.userName }).select("addresses").lean();
                const shipAddr = user?.addresses?.find(a => !a.billingAddress) ?? user?.addresses?.[0];
                if (shipAddr?.address1) {
                    businessAddress = {
                        name: shipAddr.name,
                        address1: shipAddr.address1,
                        address2: shipAddr.address2 ?? "",
                        city: shipAddr.city,
                        state: shipAddr.state,
                        postalCode: shipAddr.zip,
                        country: shipAddr.country || "US",
                        phone: shipAddr.phone ?? "",
                    };
                }
            }
        } catch {}
    }

    try {
        let rates = await getRates({
            address: data.address,
            businessAddress,
            type: data.shippingType,
            providers: ["usps", "fedex"],
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
        console.log(rates);
        return NextResponse.json({ error: false, rates });
    } catch(e) {
        console.log(e);
        return NextResponse.json({ error: true, msg: e });
    }
}
