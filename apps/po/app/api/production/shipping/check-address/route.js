import {NextApiRequest, NextResponse} from "next/server";
import {checkAddress} from "@pythias/shipping"



export async function POST(req=NextApiRequest){
    let data = await req.json()
    let res = await checkAddress({address:data.address, credentials: {
        clientId: process.env.uspsClientId,
        clientSecret: process.env.uspsClientSecret,
        crid: process.env.uspsCRID,
        mid: process.env.uspsMID,
        manifestMID: process.env.manifestMID,
        accountNumber: process.env.accountNumber
    }, })
    console.log(res.data)
}