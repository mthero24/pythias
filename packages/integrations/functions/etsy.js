const etsyKeyString="480pxuspxi5wz93puk47snye"
const etsySharedSecret="16xlth05x7"
import crypto from "crypto";
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

export const generateRedirectURI = (baseURL) => {
    const sha256 = (buffer) =>
        crypto.createHash("sha256").update(buffer).digest();

    // We’ll use the verifier to generate the challenge.
    // The verifier needs to be saved for a future step in the OAuth flow.
    let codeVerifier = base64URLEncode("nicepajamas");

    // With these functions, we can generate
    // the values needed for our OAuth authorization grant.
    const codeChallenge = base64URLEncode(sha256(codeVerifier));
    const state = Math.random().toString(36).substring(7);

    console.log(`State: ${state}`);
    console.log(`Code challenge: ${codeChallenge}`);
    console.log(`Code verifier: ${codeVerifier}`);
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${baseURL}/api/integrations/etsy&scope=transactions_r email_r transactions_w listings_r listings_w listings_d shops_r shops_w&client_id=${etsyKeyString}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
};
const base64URLEncode = (str) =>
    str
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
