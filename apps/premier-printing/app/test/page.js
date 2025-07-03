import { getOrdersTikTok } from "@pythias/integrations";
import TikTokAuth from "@/models/tiktok";
export default async function Test(){
    let auths = await TikTokAuth.find({provider: "premierPrinting"})
    console.log(auths);
    for(let a of auths){
        for(let store of a.shop_list){
            let credentials = a
            credentials.shop_cypher = store.shop_cypher
            let res = getOrdersTikTok({credentials});
            if (res.error && res.error.msg == "refresh") {
                let access_token = await getAccessTokenFromRefreshToken(
                    credentials.refresh_token
                );
                console.log(access_token, "access token");
                for (let key in Object.keys(access_token)) {
                    credentials[key] = access_token[key];
                    credentials.date = new Date(Date.now());
                    credentials = await credentials.save();
                }
                res = getOrdersTikTok({ credentials });
            }
            console.log(res)
        }
    }
    return <h1>test</h1>
}