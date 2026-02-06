import { NextApiRequest, NextResponse } from "next/server";
import {getRates} from "@pythias/shipping";

export async function POST(req= NextApiRequest){
    let data = await req.json();
    console.log(data)
    if(!data.address.country) data.address.country = "US"
    try{
        let rates = await getRates({
            address: data.address,
            businessAddress: JSON.parse(process.env.businessAddress),
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
        });
        console.log(rates)
        return NextResponse.json({error: false, rates})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg:e})
    }
}