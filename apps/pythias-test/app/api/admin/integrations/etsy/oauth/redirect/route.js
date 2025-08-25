import {NextApiRequest, NextResponse} from "next/server"
import {ApiKeyIntegrations} from "@pythias/mongo";
const clientID = '480pxuspxi5wz93puk47snye';
const clientVerifier = 'catsaregreat';
const redirectUri = 'http://localhost:3007/api/admin/integrations/etsy/oauth/redirect';


export async function GET(req=NextApiRequest) {
    let code = await req.nextUrl.searchParams.get('code');
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
        let conn = new ApiKeyIntegrations({
            apiKey: data.access_token,
            apiSecret: clientVerifier,
            organization: "admin",
            provider: "pythias-test",
            type: "etsy",
            refreshToken: data.refresh_token,
            tokenType: "bearer",
            displayName: "Etsy Shop"
        })
        await conn.save()
        return NextResponse.redirect("http://localhost:3007/admin/integrations");
    } catch (e) {
        console.log(e);
        return Response.json({ error: e.toString() }, { status: 500 });
    }
}