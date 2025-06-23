import tiktokShop from "tiktok-shop";

export const getAccessTokenUsingAuthCode = async (config, authCode) => {
    // How to get Auth Code: https://partner.tiktokshop.com/doc/page/63fd743c715d622a338c4e5a
    const accessToken = await tiktokShop.authCodeToken(config, authCode);
    return accessToken.data;
};

// getAccessTokenUsingAuthCode();

export const getAccessTokenFromRefreshToken = async (credential_id) => {
    let credentials = await TikTokCredentials.findOne({ _id: credential_id });
    // How to get Auth Code: https://partner.tiktokshop.com/doc/page/63fd743c715d622a338c4e5a
    const refreshToken = credentials.refreshToken;
    const accessToken = await tiktokShop.generateToken(config, refreshToken);

    credentials.accessToken = accessToken.access_token;
    credentials.refreshToken = accessToken.refresh_token;

    console.log(credentials, "updated");
    await credentials.save();

    return accessToken.access_token;
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
export const getAuthorizedShops = async (credentials, config) => {
    let accessToken = credentials.accessToken;
    const url = `https://open-api.tiktokglobalshop.com/authorization/202309/shops?app_key=${config.app_key}`;
    const { signature, timestamp } = tiktokShop.signByUrl(url, config.app_secret);
    try {
        const response = await axios.get(url, {
        params: {
            sign: signature,
            timestamp: timestamp,
        },
        headers: {
            "x-tts-access-token": accessToken,
            "content-type": "application/json",
        },
        });
        return response.data.data.shops;
    } catch (error) {
        console.error("Error fetching shops:", error);
        throw error;
    }
};