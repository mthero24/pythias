import {NextApiRequest, NextResponse} from "next/server";
import {updateListings} from "@/functions/updateListings";
import {CSVUpdates} from "@pythias/mongo";
 const startUpdate = async (csvUpdate, data)=>{
    await updateListings(csvUpdate, data)
 }
export async function GET(req){
    let id = await req.nextUrl.searchParams.get("id")
    let csvupdate = await CSVUpdates.findOne({_id: id}).lean()
    let past = await CSVUpdates.find({active: false}).lean()
    return NextResponse.json({error: false, csvupdate, past})
}

export async function POST(req=NextApiRequest){
    let data = await req.json()
    let csvupdate = new CSVUpdates({
        active: true,
        date: new Date(Date.now()),
    })
    csvupdate = await csvupdate.save()
    startUpdate(csvupdate, data)
    let past = await CSVUpdates.find({active: false})
    return NextResponse.json({error: false, csvupdate, past})
}