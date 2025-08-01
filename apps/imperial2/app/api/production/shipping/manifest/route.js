import { NextApiRequest, NextResponse } from "next/server";
import {Manifest} from "@pythias/mongo"
import { uspsGenerateManifest } from "@pythias/shipping";
export async function GET(req = NextApiRequest) {
    let manifests = await Manifest.find({Date: {$gt: new Date(Date.now() -v12 * (60 * 60 * 1000))}}).limit(1000);
    console.log(manifests.length)
    let skip = 1000
    let PicNumbers = [];
    while(manifests.length > 0){
        for(let m of manifests){
            PicNumbers.push(m.pic)
        }
        manifests = await Manifest.find({Date: {$gt: new Date(Date.now() - 8 * (60 * 60 * 1000))}}).skip(skip).limit(1000);
        skip += 1000
    }
    console.log(PicNumbers.length, "picnumbers")
    let res = await uspsGenerateManifest({PicNumbers, credentials: {clientId: process.env.uspsClientId,
                clientSecret: process.env.uspsClientSecret,
                crid: process.env.uspsCRID,
                mid: process.env.uspsMID,
                manifestMID: process.env.manifestMID,
                accountNumber: process.env.accountNumber,
                api: "apis"}, businessAddress: JSON.parse(process.env.businessAddress)})
    console.log(res)
    if(!res.error){
        await Manifest.deleteMany({});
    }
    return NextResponse.json(res);
    
}