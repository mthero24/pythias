import {NextApiRequest, NextResponse} from "next/server";
import {LicenseHolders} from "@pythias/mongo";

export async function POST(req=NextApiRequest){
    let {license} = await req.json()
    console.log(license)
    if(!license._id){
        license = new LicenseHolders({...license})
        await license.save()
    }else {
        license = await LicenseHolders.findByIdAndUpdate(license._id, {...license})
    }
    let licenses = await LicenseHolders.find().lean()
    return NextResponse.json({error: false, licenses})
}