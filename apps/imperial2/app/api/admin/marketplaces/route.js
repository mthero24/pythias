import {MarketPlaces, Blank} from "@pythias/mongo";
import {NextApiRequest, NextResponse} from "next/server";

export async function GET(req = NextApiRequest) {
    let market = req.nextUrl.searchParams.get("marketPlace");
    let marketPlaces = await MarketPlaces.find(market ? { _id: market } : {}).lean()
    return NextResponse.json({ error: false, marketPlaces })
}
export async function POST(req= NextApiRequest){
    let data = await req.json()
    if(data.marketPlace._id){
        let nmp = await MarketPlaces.findOneAndUpdate({ _id: data.marketPlace._id}, data.marketPlace, { new: true, returnNewDocument: true }).lean( )
    }
    else{
        let nmp = new MarketPlaces(data.marketPlace)
        nmp = await nmp.save()
    }
    if(data.blank){
        let blank = await Blank.findOneAndUpdate({_id: data.blank._id}, data.blank).lean()
    }
    let marketPlaces = await MarketPlaces.find({}).lean()
    return NextResponse.json({error: false, marketPlaces})
}