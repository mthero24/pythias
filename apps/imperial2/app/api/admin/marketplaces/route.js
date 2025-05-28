import MarketPlaces from "@/models/MarketPlaces";
import {NextApiRequest, NextResponse} from "next/server";

export async function POST(req= NextApiRequest){
    let data = await req.json()
    let nmp = new MarketPlaces(data)
    nmp = await nmp.save()
    nmp = await MarketPlaces.findOne({_id: nmp}).lean()
    let marketPlaces = await MarketPlaces.find({}).lean()
    return NextResponse.json({error: false, marketplace: nmp, marketPlaces})
}