const etsyKeyString="480pxuspxi5wz93puk47snye"
const etsySharedSecret="16xlth05x7"
import crypto from "crypto";
import axios from "axios";
export const getToken = async (code, baseUrl) => {
    const authCode = code;
    const tokenUrl = "https://api.etsy.com/v3/public/oauth/token";
    const requestOptions = {
        method: "POST",
        body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: etsyKeyString,
            redirect_uri: `${BASE_URL}/api/integrations/etsy/redirect`,
            code: authCode,
            code_verifier: base64URLEncode("nicepajamas"),
        }),
        headers: {
            "Content-Type": "application/json",
        },
    };

    try {
        const response = await axios.post(
            tokenUrl,
            {
                grant_type: "authorization_code",
                client_id: etsyKeyString,
                redirect_uri: `${baseUrl}/api/integrations/etsy/redirect`,
                code: authCode,
                code_verifier: base64URLEncode("nicepajamas"),
            },
            { headers: requestOptions.headers }
        );
        console.log(response.data);
        return response.data;
    } catch (e) {

        console.log(e);
        notify("etsy", e.toString());
    }
};

export const refreshToken = async (refreshToken) => {
    const requestOptions = {
        headers: {
            "x-api-key": etsyKeyString,
        },
    };
    let url = `https://api.etsy.com/v3/public/oauth/token`;
    let response = await axios.post(
        url,
        {
            grant_type: "refresh_token",
            client_id: etsyKeyString,
            refresh_token: refreshToken,
        },
        requestOptions
    );

    console.log(response.data);
    return response.data;
}

export const generateRedirectURI = (baseURL) => {
    // The next two functions help us generate the code challenge
    // required by Etsy’s OAuth implementation.
    const base64URLEncode = (str) =>
        str
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");

    const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest();

    // We’ll use the verifier to generate the challenge.
    // The verifier needs to be saved for a future step in the OAuth flow.
    const codeVerifier = base64URLEncode("catsaregreat");

    // With these functions, we can generate
    // the values needed for our OAuth authorization grant.
    const codeChallenge = base64URLEncode(sha256(codeVerifier));
    const state = Math.random().toString(36).substring(7);

    console.log(`State: ${state}`);
    console.log(`Code challenge: ${codeChallenge}`);
    console.log(`Code verifier: ${codeVerifier}`);
    console.log(`Full URL: https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3003/oauth/redirect&scope=email_r&client_id=480pxuspxi5wz93puk47snye&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`)
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3007/api/admin/integrations/etsy/oauth/redirect&scope=email_r&client_id=480pxuspxi5wz93puk47snye&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
};
const base64URLEncode = (str) =>
    str
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

export const uploadListingImage = async (
    shop_id,
    listing_id,
    formData,
    access_token
) => {
    const requestOptions = {
        headers: {
            "x-api-key": ETSY_KEYSTRING,
            Authorization: `Bearer ${access_token}`,
            ...formData.getHeaders(),
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${shop_id}/listings/${listing_id}/images`;
    let response = await api.post(url, formData, requestOptions);
    return response;
};
