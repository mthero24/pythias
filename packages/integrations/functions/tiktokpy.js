import tiktokShop from "tiktok-shop";
import axios from "axios"
import btoa from "btoa"
import FormData from "form-data"
const baseUrl = "https://open-api.tiktokglobalshop.com"
const getConfig = async () => {
    const localKey    = process.env.TIK_TOK_APP_KEY || process.env.tiktok_app_key || process.env.Tik_Tok_AppKey;
    const localSecret = process.env.tiktok_app_secret || process.env.Tik_Tok_AppSecret;
    if (localKey && localSecret) return { app_key: localKey, app_secret: localSecret };
    const res = await axios.get("https://www.pythiastechnologies.com/api/tiktok/config", {
        headers: { Authorization: `Basic ${btoa(process.env.pythiasTiktokConfigAuth)}` },
    });
    return res?.data?.config;
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
    return accessToken;
};
export const generateAuthorizationUrl = async (state) => {
    const appKey = process.env.TIK_TOK_APP_KEY
        || process.env.tiktok_app_key
        || process.env.Tik_Tok_AppKey
        || (await getConfig().catch(() => null))?.app_key;
    if (!appKey) throw new Error("TikTok app_key not configured — set TIK_TOK_APP_KEY in your app's env");
    const authBase = "https://auth.tiktok-shops.com/oauth/authorize";
    const callbackUrl = "https://www.pythiastechnologies.com/api/tiktok";
    const params = {
        app_key: appKey,
        redirect_uri: encodeURIComponent(callbackUrl),
        state: state || Math.random().toString(36).substring(2, 15),
        shop_region: "US",
        locale: "en",
    };
    const queryString = Object.keys(params)
        .map((key) => `${key}=${params[key]}`)
        .join("&");
    return `${authBase}?${queryString}`;
};

export const buildUrl = (baseUrl, params) => {
  let url = new URL(baseUrl);
  let keys = Object.keys(params).sort((a, b) => a.localeCompare(b));
  for (let key of keys) {
    url.searchParams.append(key, params[key]);
  }
  return url.toString();
};

export const getAuthorizedShops = async (credentials) => {
    let config = await getConfig();
    const baseUrl = "https://open-api.tiktokglobalshop.com/authorization/202309/shops";
    const params = { app_key: config.app_key };
    const signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(signUrl, config.app_secret);
    params.sign = signature;
    params.timestamp = timestamp;
    try {
        const response = await axios.get(buildUrl(baseUrl, params), {
            headers: {
                "x-tts-access-token": credentials.access_token,
                "content-type": "application/json",
            },
        });
        const data = response.data?.data ?? {};
        // v202309 returns `shops` with `cipher` field; normalise to `shop_list` with `shop_cipher`
        const shops = data.shops ?? data.shop_list ?? [];
        const shop_list = shops.map(s => ({ ...s, shop_cipher: s.shop_cipher ?? s.cipher }));
        return { error: false, shop_list };
    } catch (error) {
        const errData = error.response?.data;
        const code = errData?.code;
        if (code == 36009004 || code == 105002) return { error: true, msg: "refresh" };
        console.log("getAuthorizedShops error:", errData ?? error.message);
        return { error: true, msg: errData?.message ?? error.message };
    }
};
export async function createProduct({tiktokProduct, credentials, update}){
    let config = await getConfig()
     const baseUrl =
      `https://open-api.tiktokglobalshop.com/product/202309/products${update? `/${update}`: ""}`;
    let accessToken = credentials.access_token;
    const params = {
      app_key: config.app_key,
      shop_cipher: credentials.shop_list[0].shop_cipher,
      version: "202309",
      category_version: "v2", // Add this line for US shop
    };
    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(
      signUrl,
      config.app_secret,
      {...tiktokProduct}
    );
    params["sign"] = signature;
    params["timestamp"] = timestamp;
    params["access_token"] = accessToken;
    let finalUrl = buildUrl(baseUrl, params);
    let result;
    try {
        if (!update) {
            result = await axios.post(finalUrl, { ...tiktokProduct }, {
                headers: { "Content-Type": "application/json", "x-tts-access-token": accessToken },
            });
        } else {
            result = await axios.put(finalUrl, { ...tiktokProduct }, {
                headers: { "Content-Type": "application/json", "x-tts-access-token": accessToken },
            });
        }
    } catch (e) {
        const errData = e.response?.data;
        console.log("createProduct error:", errData ?? e.message);
        const code = errData?.code;
        if (code == 36009004 || code == 105002) return { error: true, msg: "refresh" };
        return { error: true, msg: errData?.message ?? e.message };
    }
    const data = result?.data;
    if (data?.code && data.code !== 0) {
        console.log("createProduct API error:", data);
        const code = data.code;
        if (code == 36009004 || code == 105002) return { error: true, msg: "refresh" };
        return { error: true, msg: data.message ?? `code ${code}` };
    }
    console.log("createProduct result:", data?.data.product_id)
    return { error: false, product: data?.data };
}
export const getRecommendedCategory = async (product_name, credentials) => {
    const config = await getConfig()
    const baseUrl =
        "https://open-api.tiktokglobalshop.com/product/202309/categories/recommend";
    let accessToken = credentials.access_token;
    const params = {
        app_key: config.app_key,
        shop_cipher: credentials.shop_list[0].shop_cipher,
        version: "202309",
        category_version: "v2",
    };

    const body = {
        product_title: product_name,
    };

    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(
        signUrl,
        config.app_secret,
        body
    );
    params["sign"] = signature;
    params["timestamp"] = timestamp;
    params["access_token"] = accessToken;
    let finalUrl = buildUrl(baseUrl, params);
    let errRes
    let result = await axios.post(finalUrl, body, {
        headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": accessToken,
        },
    }).catch(e=>{console.log(e.response.data); errRes = e.response.data;});
    if(errRes){
        if (errRes.code == 36009004 || errRes.code == 105002) {
          return { error: true, msg: "refresh" };
        }
    } 
    return {error: false, categories: result?.data.data.categories};
};
export const getAttributes = async (category_id, credentials)=>{
    const config = await getConfig()
    const baseUrl = `https://open-api.tiktokglobalshop.com/product/202309/categories/${category_id}/attributes`;
    let accessToken = credentials.access_token;
    const params = {
        app_key: config.app_key,
        shop_cipher: credentials.shop_list[0].shop_cipher,
        version: "202309",
        locale: "en-US",
        category_version: "v2", // Add this line for US shop
    };
    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(
        signUrl,
        config.app_secret
    );
    params["sign"] = signature;
    params["timestamp"] = timestamp;
    params["access_token"] = accessToken;
    let finalUrl = buildUrl(baseUrl, params);
    let errRes
    let result = await axios.get(finalUrl, {
        headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": accessToken,
        },
    }).catch(e=>{console.log(e.response.data)});
    if(errRes){
        if (errRes.code == 36009004 || errRes.code == 105002) {
          return { error: true, msg: "refresh" };
        }
    } 
    return {error: false, attributes: result.data.data.attributes};
}
export const getWarehouses = async (credentials) => {
    const config = await getConfig()
    const baseUrl = `https://open-api.tiktokglobalshop.com/logistics/202309/warehouses`;
    let accessToken = credentials.access_token;
    const params = {
        app_key: config.app_key,
        shop_cipher: credentials.shop_list[0].shop_cipher,
        version: "202309",
        category_version: "v2", // Add this line for US shop
    };
    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(
        signUrl,
        config.app_secret
    );
    params["sign"] = signature;
    params["timestamp"] = timestamp;
    params["access_token"] = accessToken;
    let finalUrl = buildUrl(baseUrl, params);
    let errRes
    let result = await axios.get(finalUrl, {
        headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": accessToken,
        },
    }).catch(e=>{console.log(e.response.data)});
    if(errRes){
        if (errRes.code == 36009004 || errRes.code == 105002) {
          return { error: true, msg: "refresh" };
        }
    } 
    return {error: false, warehouses: result.data.data.warehouses};
};
export const uploadProductVideo = async (uri, credentials) => {
    const config = await getConfig();
    const baseUrl = "https://open-api.tiktokglobalshop.com/product/202309/videos/upload";
    const accessToken = credentials.access_token;
    const params = { app_key: config.app_key };

    const response = await axios.get(uri, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    const formData = new FormData();
    formData.append("data", buffer, { filename: "video.mp4", contentType: "video/mp4" });
    formData.append("use_case", "PRODUCT_MAIN_VIDEO");

    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(signUrl, config.app_secret);
    params["sign"] = signature;
    params["timestamp"] = timestamp;
    params["access_token"] = accessToken;
    const finalUrl = buildUrl(baseUrl, params);

    try {
        const result = await axios.post(finalUrl, formData, {
            headers: { ...formData.getHeaders(), "x-tts-access-token": accessToken },
        });
        const data = result.data?.data;
        console.log("uploadProductVideo result:", data);
        return { error: false, video_id: data?.video_id ?? data?.id };
    } catch (e) {
        const errData = e.response?.data;
        console.log("uploadProductVideo error:", errData ?? e.message);
        const code = errData?.code;
        if (code == 36009004 || code == 105002) return { error: true, msg: "refresh" };
        return { error: true, msg: errData?.message ?? e.message };
    }
};

export const uploadProductImage = async (uri, credentials, type) => {
    //console.log(credentials, "credentials")
    const config = await getConfig()
    const baseUrl =
      "https://open-api.tiktokglobalshop.com/product/202309/images/upload";
    let accessToken = credentials.access_token;
    const params = {
      app_key: config.app_key,
    };

    const response = await axios.get(uri, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    const formData = new FormData();
    formData.append("data", buffer, { filename: "image.jpg", contentType: "image/jpeg" });
    formData.append("use_case", type);

    // Step 4: Prepare the request body and URL

    let signUrl = buildUrl(baseUrl, params);
    //console.log(signUrl)
    const { signature, timestamp } = tiktokShop.signByUrl(
      signUrl,
      config.app_secret
    );

    params["sign"] = signature;
    params["timestamp"] = timestamp;
    params["access_token"] = accessToken;
    let finalUrl = buildUrl(baseUrl, params);
    let errRes
    let result = await axios.post(finalUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        "x-tts-access-token": accessToken,
      },
    }).catch(e=>{console.log(e.response.data)});
    if(errRes){
        if (errRes.code == 36009004 || errRes.code == 105002) {
          return { error: true, msg: "refresh" };
        } else {
          return { error: true, msg: errRes.code };
        }
    } 
    console.log(result?.data.data)
    return {error: false, uri: result?.data.data.uri}
};

export const getOrders = async ({next_page_token, credentials}) => {
    const config = await getConfig();
    //console.log(config, "config")
    //console.log(credentials.shop_cipher)
    let accessToken = credentials.access_token;
    const baseUrl =
        "https://open-api.tiktokglobalshop.com/order/202309/orders/search";
    const params = {
      app_key: config.app_key,
      page_size: 100,
      shop_cipher: credentials.shop_cipher,
      shop_id: "",
      version: "202309",
      category_version: "v2", // Add this line for US shop
    };
    if (next_page_token) {
        params["page_token"] = next_page_token;
    }
    const body = {
        order_status: "AWAITING_SHIPMENT",
    };
    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(
        signUrl,
        config.app_secret,
        body
    );
    params["sign"] = signature;
    params["timestamp"] = timestamp;
    params["access_token"] = accessToken;
    let finalUrl = buildUrl(baseUrl, params);

    try {
        let errRes;
        let result = await axios
          .post(finalUrl, body, {
            headers: {
              "Content-Type": "application/json",
              "x-tts-access-token": accessToken,
            },
          })
          .catch((e) => {
            //console.log(e.response.data);
            errRes = e.response.data
          });
        if (errRes) {
            console.log(errRes)
            if (errRes.code == 36009004 || errRes.code == 105002) {
                return { error: true, msg: "refresh" };
            } else {
                return { error: true, msg: errRes.code };
            }
        } ;
        //console.log(result.data);
        let orders = result.data.data.orders;
        if (result.data.data.next_page_token) {
            let nextPage = await getOrders({ next_page_token: result.data.data.next_page_token, credentials });
            if (!nextPage.error) orders = [...nextPage.orders, ...orders];
        }
        return { error: false, orders: orders };
    } catch (err) {
        return { error: true, msg: JSON.stringify(err) };
    }
};

export const searchProducts = async (credentials, shop_cipher, { status = "ACTIVATE", page_size = 20, page_token = null } = {}) => {
    const config = await getConfig();
    const baseUrl = "https://open-api.tiktokglobalshop.com/product/202309/products/search";
    const accessToken = credentials.access_token;
    const params = { app_key: config.app_key, shop_cipher, version: "202309", category_version: "v2", page_size };
    if (page_token) params.page_token = page_token;
    const body = { status };
    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(signUrl, config.app_secret, body);
    params["sign"] = signature; params["timestamp"] = timestamp; params["access_token"] = accessToken;
    let errRes;
    const result = await axios.post(buildUrl(baseUrl, params), body, {
        headers: { "Content-Type": "application/json", "x-tts-access-token": accessToken },
    }).catch(e => { errRes = e.response?.data; });
    if (errRes) {
        if (errRes.code == 36009004 || errRes.code == 105002) return { error: true, msg: "refresh" };
        return { error: true, msg: errRes.code };
    }
    return { error: false, products: result?.data?.data?.products ?? [], total: result?.data?.data?.total_count ?? 0 };
};

export const updateInventory = async (product_id, skus, credentials, shop_cipher) => {
    const config = await getConfig();
    const baseUrl = `https://open-api.tiktokglobalshop.com/product/202309/products/${product_id}/inventory`;
    const accessToken = credentials.access_token;
    const params = { app_key: config.app_key, shop_cipher, version: "202309" };
    const body = { skus };
    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(signUrl, config.app_secret, body);
    params["sign"] = signature; params["timestamp"] = timestamp; params["access_token"] = accessToken;
    let errRes;
    await axios.put(buildUrl(baseUrl, params), body, {
        headers: { "Content-Type": "application/json", "x-tts-access-token": accessToken },
    }).catch(e => { errRes = e.response?.data; });
    if (errRes) {
        if (errRes.code == 36009004 || errRes.code == 105002) return { error: true, msg: "refresh" };
        return { error: true, msg: errRes.code };
    }
    return { error: false };
};

export const updateProductPrice = async (product_id, skus, credentials, shop_cipher) => {
    const config = await getConfig();
    const baseUrl = `https://open-api.tiktokglobalshop.com/product/202309/products/${product_id}/prices`;
    const accessToken = credentials.access_token;
    const params = { app_key: config.app_key, shop_cipher, version: "202309" };
    const body = { skus };
    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(signUrl, config.app_secret, body);
    params["sign"] = signature; params["timestamp"] = timestamp; params["access_token"] = accessToken;
    let errRes;
    await axios.put(buildUrl(baseUrl, params), body, {
        headers: { "Content-Type": "application/json", "x-tts-access-token": accessToken },
    }).catch(e => { errRes = e.response?.data; });
    if (errRes) {
        if (errRes.code == 36009004 || errRes.code == 105002) return { error: true, msg: "refresh" };
        return { error: true, msg: errRes.code };
    }
    return { error: false };
};

export const getShippingProvidersTikTok = async (credentials, shop_cipher) => {
    const config = await getConfig();
    const baseUrl = "https://open-api.tiktokglobalshop.com/logistics/202309/shipping_providers";
    const accessToken = credentials.access_token;
    const params = { app_key: config.app_key, shop_cipher, version: "202309" };
    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(signUrl, config.app_secret);
    params["sign"] = signature; params["timestamp"] = timestamp; params["access_token"] = accessToken;
    let errRes;
    const result = await axios.get(buildUrl(baseUrl, params), {
        headers: { "Content-Type": "application/json", "x-tts-access-token": accessToken },
    }).catch(e => { errRes = e.response?.data; });
    if (errRes) {
        if (errRes.code == 36009004 || errRes.code == 105002) return { error: true, msg: "refresh" };
        return { error: true, msg: errRes.code };
    }
    return { error: false, providers: result?.data?.data?.shipping_providers ?? [] };
};

export const fulfillOrderTikTok = async (order_id, { line_item_ids, tracking_number, shipping_provider_id }, credentials, shop_cipher) => {
    const config = await getConfig();
    const baseUrl = `https://open-api.tiktokglobalshop.com/fulfillment/202309/orders/${order_id}/packages`;
    const accessToken = credentials.access_token;
    const params = { app_key: config.app_key, shop_cipher, version: "202309" };
    const body = {
        order_line_items: line_item_ids.map(id => ({ id })),
        tracking_number,
        shipping_provider_id,
    };
    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(signUrl, config.app_secret, body);
    params["sign"] = signature; params["timestamp"] = timestamp; params["access_token"] = accessToken;
    let errRes;
    const result = await axios.post(buildUrl(baseUrl, params), body, {
        headers: { "Content-Type": "application/json", "x-tts-access-token": accessToken },
    }).catch(e => { errRes = e.response?.data; });
    if (errRes) {
        if (errRes.code == 36009004 || errRes.code == 105002) return { error: true, msg: "refresh" };
        return { error: true, msg: errRes.message ?? String(errRes.code) };
    }
    return { error: false, package_id: result?.data?.data?.package_id };
};