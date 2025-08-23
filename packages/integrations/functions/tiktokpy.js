import tiktokShop from "tiktok-shop";
import axios from "axios"
import btoa from "btoa"
import FormData from "form-data"
import fs from "fs"
import path from "path"
const baseUrl = "https://open-api.tiktokglobalshop.com"
const getConfig = async ()=>{
    let headers = {
        headers: {
            Authorization: `Basic ${btoa("mthero:BadaBing@12")}`
        }
    }
    let res = await axios.get("http://www.pythiastechnologies.com/api/tiktok/config", headers)
   // console.log(res?.data)
    return res?.data.config
}
export const getAccessTokenUsingAuthCode = async (config, authCode) => {
    // How to get Auth Code: https://partner.tiktokshop.com/doc/page/63fd743c715d622a338c4e5a
    const accessToken = await tiktokShop.authCodeToken(config, authCode);
    return accessToken.data;
};

// getAccessTokenUsingAuthCode();

export const getAccessTokenFromRefreshToken = async (refreshToken) => {
    console.log(refreshToken, "refresh token")
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

export const buildUrl = (baseUrl, params) => {
  let url = new URL(baseUrl);
  let keys = Object.keys(params).sort((a, b) => a.localeCompare(b));
  for (let key of keys) {
    url.searchParams.append(key, params[key]);
  }
  return url.toString();
};

export const getAuthorizedShops = async (credentials) => {
    let config = await getConfig()
    console.log(config, credentials)
    let accessToken = credentials.accessToken;
    
    const url = `https://open-api.tiktokglobalshop.com/api/shop/get_authorized_shop?access_token=${credentials.access_token}&app_key=${config.app_key}&version=${202212}`;
    const { signature, timestamp } = tiktokShop.signByUrl(url, config.app_secret);
    console.log(signature, timestamp)
    try {
        let errRes
        const response = await axios.get(url, {
            params: {
                timestamp: timestamp,
                sign: signature,
            },
            headers: {
                "x-tts-access-token": credentials.access_token,
                "content-type": "application/json",
            },
        }).catch(e=>{console.log(e.response.data); errRes = e.response.data});
        if(errRes){
            if (errRes.code == 36009004 || errRes.code == 105002) {
              return { error: true, msg: "refresh" };
            }
        } 
        console.log(response.data.data)
        return {error: false, ...response.data.data};
    } catch (error) {
        return {error: true, msg: "refresh"}
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
    let errRes
    let result;
    if(!update){
      result = await axios.post(finalUrl, {...tiktokProduct}, {
        headers: {
          "Content-Type": "application/json",
          "x-tts-access-token": accessToken,
        },
      }).catch(e=>{console.log(e.response.data); errRes = e.response.data});
    }else{
      result = await axios
        .put(
          finalUrl,
          { ...tiktokProduct },
          {
            headers: {
              "Content-Type": "application/json",
              "x-tts-access-token": accessToken,
            },
          }
        )
        .catch((e) => {
          console.log(e.response.data);
          errRes = e.response.data;
        });
    }
    if(errRes){
        if (errRes.code == 36009004 || errRes.code == 105002) {
          return { error: true, msg: "refresh" };
        } else {
          return { error: true, msg: errRes.code };
        }
    } 
    console.log(result?.data)
    return {error: false, product: result?.data.data};;
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
export const uploadProductImage = async (uri, credentials, type) => {
    //console.log(credentials, "credentials")
    const config = await getConfig()
    const baseUrl =
      "https://open-api.tiktokglobalshop.com/product/202309/images/upload";
    let accessToken = credentials.access_token;
    const params = {
      app_key: config.app_key,
    };

    //download uri with axios and somehow turn into a file to upload view multipart form data below

    const response = await axios.get(uri, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    // Step 2: Convert the downloaded image into a file
    fs.writeFileSync(`./temp_images/temp_image.jpg`, buffer);
    // Step 3: Create a FormData object
    const formData = new FormData();
    formData.append("data", fs.createReadStream(`./temp_images/temp_image.jpg`));
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
        let nextPageOrders = await getOrders(
          {next_page_token: result.data.data.next_page_token,
          credentials}
        );
        orders = [...nextPageOrders, ...orders];
        }
        return { error: false, orders: orders };
    } catch (err) {
        return { error: true, msg: JSON.stringify(err) };
    }
};