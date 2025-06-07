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
            type: data.marketplace == "faire"? null: data.marketplace == "Zulily" || data.marketplace == "TSC"? "Expedited": "Standard",
            providers: ["shipstation", "ups"],
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
                accountNumber: process.env.accountNumber,
                api: "apis"
            },
            credentialsFedEx: {
                accountNumber: process.env.tpalfedexaccountnumber,
                meterNumber: process.env.tpalfedexmeternumber,
                key: process.env.tpalfedexkey,
                password: process.env.tpalfedexpassword,
            },
            credentialsFedExNew: {
                accountNumber: process.env.AccountFedExTest,
                key: process.env.ApiKeyTestFedEx,
                secret: process.env.SecretKeyFedExTest,
            },
            credentialsUPS: {
                accountNumber: process.env.upsAccountNumber,
                clientID: process.env.upsClientId,
                clientSecret: process.env.upsClientSecret,
            },
            credentialsShipStation: {
                apiKey: process.env.ssV2
            },
            carrierCodes :{
                usps: "se-1652813",
                ups: "se-801899"
            },
            warehouse_id: 62666,
        });
        return NextResponse.json({error: false, rates: rates? rates: []})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg:e})
    }
}