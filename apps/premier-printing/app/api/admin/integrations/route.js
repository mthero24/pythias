import {NextApiRequest, NextResponse} from "next/server"
import {generateAuthorizationUrl} from "@pythias/integrations"
import { ApiKeyIntegrations, TikTokAuth } from "@pythias/mongo";
import next from "next";
export async function GET(req=NextApiRequest){
    let integration = await ApiKeyIntegrations.find({ provider: req.nextUrl.searchParams.get("provider") });
    return NextResponse.json({error: false, integration})
}

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
    }else if(data.type == "acenda"){
        console.log("apiKey")
        let integration = await ApiKeyIntegrations.findOne({displayName: data.displayName, provider: data.provider});
        if(!integration){
            integration = new ApiKeyIntegrations({displayName: data.displayName, apiKey: data.apiKey, apiSecret: data.apiSecret, organization: data.organization, provider: data.provider})
            await integration.save()
        }else if(!integration.provider){
            integration.provider = data.provider
            integration.apiKey = data.apiKey;
            integration.apiSecret = data.apiSecret;
            integration.organization = data.organization;
            await integration.save()
        }
        let integrations = await ApiKeyIntegrations.find({provider: data.provider})
        return NextResponse.json({ error: false, integrations })
    }
}