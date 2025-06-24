import tiktokShop from "tiktok-shop";
import axios from "axios"
import btoa from "btoa"
const getConfig = async ()=>{
    let headers = {
        headers: {
            Authorization: `Basic ${btoa("mthero:BadaBing@12")}`
        }
    }
    let res = await axios.get("http://localhost:3007/api/tiktok/config", headers)
    console.log(res?.data)
    return res?.data.config
}
export const getAccessTokenUsingAuthCode = async (config, authCode) => {
    // How to get Auth Code: https://partner.tiktokshop.com/doc/page/63fd743c715d622a338c4e5a
    const accessToken = await tiktokShop.authCodeToken(config, authCode);
    return accessToken.data;
};

// getAccessTokenUsingAuthCode();

export const getAccessTokenFromRefreshToken = async (refreshToken) => {
    let config = await getConfig()
    const accessToken = await tiktokShop.generateToken(config, refreshToken);
    console.log(accessToken)
    return accessToken;
};
export const generateAuthorizationUrl = () => {
    // TikTok Shop OAuth URL
    const baseUrl = "https://auth.tiktok-shops.com/oauth/authorize";

    // The redirect URI should point to your tik-tok authorization endpoint
    const callbackUrl = "https://www.pythiastechologies.com/api/tiktok";

    // Parameters required for TikTok Shop authorization
    const params = {
        app_key: "6gftfd0mjp3n6",
        redirect_uri: encodeURIComponent(callbackUrl),
        state: Math.random().toString(36).substring(2, 15), // Random state for security
        shop_region: "US", // Set to your region
        locale: "en",
    };

    // Build the URL with parameters
    const queryString = Object.keys(params)
        .map((key) => `${key}=${params[key]}`)
        .join("&");

    return `${baseUrl}?${queryString}`;
};
export const getAuthorizedShops = async (credentials) => {
    let config = await getConfig()
    console.log(config, credentials)
    let accessToken = credentials.accessToken;
    const url = `https://open-api.tiktokglobalshop.com/api/shop/get_authorized_shop?app_key=${config.app_key}`;
    const { signature, timestamp } = tiktokShop.signByUrl(url, config.app_secret);
    console.log(signature, timestamp)
    try {
        let errRes
        const response = await axios.get(url, {
            params: {
                timestamp: timestamp,
                sign: signature,
                access_token: credentials.accessToken,
                version:202212
            },
            headers: {
                "content-type": "application/json",
            },
        }).catch(e=>{console.log(e.response.data); errRes = e.response.data});
        if(errRes){
            if(errRes.code == 36009004){
                return {error: true, msg: "refresh"}
            }
        } 
        return response.data.data.shops;
    } catch (error) {
        console.error("Error fetching shops:", error);
        throw error;
    }
};
export async function createProduct({design, blank}){
    let tikTokUrl = "/api/products"
}