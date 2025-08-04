import {NextApiRequest, NextResponse} from "next/server";
import {TikTokAuth} from "@pythias/mongo";
import {getAccessTokenUsingAuthCode, getAccessTokenFromRefreshToken} from "@pythias/integrations"
const config = {
    app_key: process.env.tiktok_app_key,
    app_secret: process.env.tiktok_app_secret
}
export async function GET(req=NextApiRequest){
    let data = await getAccessTokenUsingAuthCode(config, req.nextUrl.searchParams.get("code"))
    let auth = await TikTokAuth.findOne({seller_name: data.seller_name})
    if(auth){
        for(let key in Object.keys(data)){
            auth[key] = data[key]
            auth.date= new Date(Date.now())
            await auth.save()
        }
    }else {
        auth = new TikTokAuth({...data, date: new Date(Date.now())})
        console.log(auth)
        await auth.save()
    }
    console.log(auth)
    return NextResponse.redirect(
      `https://${auth.provider == "premierPrinting" ? "simplysage" : auth.provider == "test"? "test": "imperial"}.pythiastechnologies.com/admin/integrations`
    );
}