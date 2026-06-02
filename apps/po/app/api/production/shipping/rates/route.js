import { NextApiRequest, NextResponse } from "next/server";
import { getRates } from "@pythias/shipping";
import { Settings } from "@pythias/mongo";
import Order from "../../../../../models/Order";
import User from "../../../../../models/User";

export async function POST(req = NextApiRequest) {
    let data = await req.json();
    if (!data.address.country) data.address.country = "US";
    if (data.packages?.length > 0) {
        data.weight = data.packages.reduce((s, p) => s + p.weight, 0);
        data.dimensions = data.packages[0].dimensions;
    }

    // Resolve ship-from: use user's first address if the order has a user, else business address
    let businessAddress;
    try {
        const settingsDoc = await Settings.findOne({ key: "businessAddress" }).lean();
        businessAddress = settingsDoc?.value ? JSON.parse(settingsDoc.value) : JSON.parse(process.env.businessAddress);
    } catch {
        try { businessAddress = JSON.parse(process.env.businessAddress); } catch {}
    }
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
            enSettings: {
            requesterID: process.env.endiciaRequesterID,
            accountNumber: process.env.endiciaAccountNUmber,
            passPhrase: process.env.endiciaPassPhrase,
            },
            credentials: {
                clientId: process.env.uspsClientId,
                clientSecret: process.env.uspsClientSecret,
                accountNumber: process.env.accountNumber
            },
            credentialsShipStation: {
                apiKey: process.env.ssV2
            },
            carrierCodes: {
                usps: "se-186007",
            },
            warehouse_id: 13111,
            credentialsFedEx: {
            accountNumber: process.env.tpalfedexaccountnumber,
            meterNumber: process.env.tpalfedexmeternumber,
            key: process.env.tpalfedexkey,
            password: process.env.tpalfedexpassword,
            },
            credentialsFedExNew: {
            accountNumber: process.env.AccountNumberFedEx,
            key: process.env.ApiKeyFedEx,
            secret: process.env.SecretKeyFedEx,
            },
            credentialsUPS: {
            accountNumber: process.env.UPSAccountNumber,
            clientID: process.env.UPSClientID,
            clientSecret: process.env.UPSClientSecret,
            },
            credentialsDHL: {
                accountNumber: process.env.dhlAccount,
                basic: process.env.dhlBasic,
            },
        });
        console.log(rates)
        return NextResponse.json({error: false, rates})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg:e})
    }
}