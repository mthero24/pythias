import {Main} from "@pythias/integrations";
import {TikTokAuth, ApiKeyIntegrations} from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import crypto from "crypto";
export const dynamic = 'force-dynamic';

function buildEtsyRedirectURI() {
    const base64URLEncode = (str) =>
        str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest();
    const codeVerifier = base64URLEncode("catsaregreat");
    const codeChallenge = base64URLEncode(sha256(codeVerifier));
    const state = Math.random().toString(36).substring(7);
    const clientId = process.env.etsyApiKey?.split(":")[0];
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${process.env.NEXTAUTH_URL || ""}/api/admin/integrations/etsy/oauth/redirect&scope=email_r%20transactions_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
}

export default async function Integrations(){
    let tiktokShops = await TikTokAuth.find({ provider: "premierPrinting" }).catch(e => { console.log(e) }) || []
    let apiKeyIntegrations = await ApiKeyIntegrations.find({ provider: "premierPrinting" })
    tiktokShops = serialize(tiktokShops)
    apiKeyIntegrations = serialize(apiKeyIntegrations)
    const etsyRedirectURI = buildEtsyRedirectURI()
    return <Main tiktokShops={tiktokShops} apiKeyIntegrations={apiKeyIntegrations} provider={"premierPrinting"} etsyRedirectURI={etsyRedirectURI}/>
}