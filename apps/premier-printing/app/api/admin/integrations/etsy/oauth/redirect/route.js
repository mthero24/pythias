import {NextApiRequest, NextResponse} from "next/server"
import {ApiKeyIntegrations} from "@pythias/mongo";
const clientID = '480pxuspxi5wz93puk47snye';
const clientVerifier = 'catsaregreat';
const redirectUri = 'http://localhost:3006/api/admin/integrations/etsy/oauth/redirect';
import axios from "axios";

export async function GET(req=NextApiRequest) {
    let code = await req.nextUrl.searchParams.get('code');
    console.log(code, "code +++++++")
    const authCode = code;
    const tokenUrl = 'https://api.etsy.com/v3/public/oauth/token';
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientID,
            redirect_uri: redirectUri,
            code: authCode,
            code_verifier: clientVerifier,
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    try {
        const response = await fetch(tokenUrl, requestOptions);
        const data = await response.json();
        console.log(data, "data");
        let res = await axios.get("https://openapi.etsy.com/v3/application/users/me", {
            headers: {
                Authorization: `Bearer ${data.access_token}`,
                "x-api-key": `${process.env.etsyApiKey}`,
            }
        }).catch(e => console.log(e.response.data, "error"));
       // console.log(res.data, "res")
        //console.log(data, "data");
        let conn = new ApiKeyIntegrations({
            apiKey: data.access_token,
            apiSecret: clientVerifier,
            organization: "admin",
            provider: "premierPrinting",
            type: "etsy",
            refreshToken: data.refresh_token,
            tokenType: "bearer",
            displayName: "Etsy Shop",
            userId: res.data.user_id,
            shopId: res.data.shop_id,
        })
        //console.log(conn, "conn +++++++")
        await conn.save()
        return NextResponse.redirect("http://localhost:3006/admin/integrations");
    } catch (e) {
        console.log(e);
        return Response.json({ error: e.toString() }, { status: 500 });
    }
}
