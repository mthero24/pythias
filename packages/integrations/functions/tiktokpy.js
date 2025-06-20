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