import {NextApiRequest, NextResponse} from "next/server";
import { Seasons, Genders } from "@pythias/mongo";

export async function POST(req = NextApiRequest){
    let data = await req.json()
    console.log(data)
    if(data.type == "season"){
        let season = new Seasons({name: data.value})
        await season.save()
        let seasons = await Seasons.find({})
        return NextResponse.json({error: false, seasons})
    }
    else if(data.type == "gender"){
        let season = new Genders({name: data.value})
        await season.save()
        let genders = await Genders.find({})
        return NextResponse.json({error: false, genders})
    }
    return NextResponse.json({error: true, msg: "no type"})
}