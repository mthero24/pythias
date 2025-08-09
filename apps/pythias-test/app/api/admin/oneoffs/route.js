import {NextApiRequest, NextResponse} from "next/server";
import { Seasons, Genders, Themes, SportUsedFor } from "@pythias/mongo";
import {saveOneOffs} from "@pythias/backend";
export async function POST(req = NextApiRequest){
    let data = await req.json()
    console.log(data)
    try{
        const {seasons, genders, themes, sports} = await saveOneOffs({data, Seasons, Genders, Themes, SportUsedFor })
        return NextResponse.json({error: false, seasons, genders, themes, sports})
    }catch(e){
        console.error("Error saving one-offs", e)
        return NextResponse.json({error: true, msg: `Error saving ${data.type}`})
    }
}