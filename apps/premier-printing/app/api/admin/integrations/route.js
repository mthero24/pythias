import {NextApiRequest, NextResponse} from "next/server"
import TikTokAuth from "@/models/tiktok";
import {generateAuthorizationUrl} from "@pythias/integrations"
import { useTheme } from "@emotion/react";
export async function POST(req=NextApiRequest){
    let data = await req.json()
    console.log(data)
    if(data.type == "tiktok"){
        console.log("tiktok")
        let auth = await TikTokAuth.findOne({seller_name: data.seller_name});
        if(!auth){
            auth = new TikTokAuth({seller_name: data.seller_name, provider: data.provider})
            await auth.save()
        }else if(!auth.provider){
            auth.provider = data.provider
            await auth.save()
        }
        let url = await generateAuthorizationUrl()
        console.log(url)
        return NextResponse.json({error: false, url})
    }
}