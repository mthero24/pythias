import TikTokAuth from "@/models/tiktok"
import {getAuthorizedShops, getAccessTokenFromRefreshToken} from "@pythias/integrations"
export default async function Test(){
    let credentials = await TikTokAuth.findOne({provider: "premierPrinting"})
    let shop = await getAuthorizedShops(credentials)
    if(shop.error && shop.msg == "refresh"){
        let access_token = getAccessTokenFromRefreshToken(credentials.refresh_token)
        credentials.access_token = access_token
        await credentials.save()
        shop = await getAuthorizedShops(credentials)
    } 
    return <h1>test</h1>
}