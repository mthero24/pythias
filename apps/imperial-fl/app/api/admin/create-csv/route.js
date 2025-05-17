import {NextApiRequest, NextResponse} from "next/server"
import {updateListings} from "@/functions/updateListings"
import CSVUpdates from "@/models/CSVUpdates"
 const startUpdate = async (csvUpdate)=>{
    await updateListings(csvUpdate)
 }
export async function GET(req){
    let id = await req.nextUrl.searchParams.get("id")
    let csvupdate = await CSVUpdates.findOne({_id: id}).lean()
    let past = await CSVUpdates.find({active: false}).lean()
    return NextResponse.json({error: false, csvupdate, past})
}

export async function POST(req=NextApiRequest){
    let csvupdate = new CSVUpdates({
        active: true,
        date: new Date(Date.now()),
    })
    csvupdate = await csvupdate.save()
    startUpdate(csvupdate)
    let past = await CSVUpdates.find({active: false})
    return NextResponse.json({error: false, csvupdate, past})
}