// const tiktokShop = require("tiktok-shop");
import axios from "axios";
import tiktokShop from "tiktok-shop";



// Extract all query param EXCEPT ' sign ', ' access_token ', You do not need to reorder the params based on alphabetical order.
const config = {
  app_key: process.env.TIK_TOK_APP_KEY, // Required
  app_secret: process.env.TIK_TOK_APP_SECRET, // Required
};

const REDIRECT_URI =
  "https://printoracle.com/api/dashboard/integrations/authorize/tik-tok";

// const TSP_SHOP_CIPHER = `TTP_rk79ZgAAAAD_6d-mu39GCpUMUPMFMFUV`;
/**
 * Generates the authorization URL for TikTok Shop integration
 * @param {string} redirectUri - Optional custom redirect URI (defaults to your app's callback URL)
 * @returns {string} The complete authorization URL
 */
const generateAuthorizationUrl = () => {
  // TikTok Shop OAuth URL
  const baseUrl = "https://auth.tiktok-shops.com/oauth/authorize";

  // The redirect URI should point to your tik-tok authorization endpoint
  const callbackUrl = REDIRECT_URI;

  // Parameters required for TikTok Shop authorization
  const params = {
    app_key: config.app_key,
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

export const getAccessTokenUsingAuthCode = async (authCode) => {
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

export const buildUrl = (baseUrl, params) => {
  let url = new URL(baseUrl);
  let keys = Object.keys(params).sort((a, b) => a.localeCompare(b));
  for (let key of keys) {
    url.searchParams.append(key, params[key]);
  }
  return url.toString();
};

const getOrders = async (next_page_token, credentials) => {
  let accessToken = credentials.accessToken;
  const baseUrl =
    "https://open-api.tiktokglobalshop.com/order/202309/orders/search";
  const params = {
    app_key: config.app_key,
    page_size: 100,
    shop_cipher: credentials.shopCipher,
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
    let result = await axios.post(finalUrl, body, {
      headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": accessToken,
      },
    });
    console.log(result.data);
    let orders = result.data.data.orders;
    if (result.data.data.next_page_token) {
      let nextPageOrders = await getOrders(
        result.data.data.next_page_token,
        credentials
      );
      orders = [...nextPageOrders, ...orders];
    }
    return orders;
  } catch (err) {
    console.log(err);
    getAccessTokenFromRefreshToken(credentials);
    return [];
  }
};

const fulfillOrder = async (
  tiktok_order_id,
  trackingNumber,
  shippingProviderId,
  credentials
) => {
  let accessToken = credentials.accessToken;

  const baseUrl = `https://open-api.tiktokglobalshop.com/fulfillment/202309/orders/${tiktok_order_id}/packages`;
  const params = {
    app_key: config.app_key,
    shop_cipher: credentials.shopCipher,
  };
  const body = {
    tracking_number: trackingNumber,
    shipping_provider_id: shippingProviderId,
  };
  let signUrl = buildUrl(baseUrl, params);
  const { signature, timestamp } = tiktokShop.signByUrl(
    signUrl,
    config.app_secret,
    body
  );
  params["sign"] = signature;
  params["timestamp"] = timestamp;
  // params['access_token'] = accessToken;
  let finalUrl = buildUrl(baseUrl, params);
  let result = await axios.post(finalUrl, body, {
    headers: {
      "Content-Type": "application/json",
      "x-tts-access-token": accessToken,
    },
  });
  console.log(result.data);
};

const getShippingProviders = async (delivery_option_id, credentials) => {
  let accessToken = credentials.accessToken;
  const baseUrl = `https://open-api.tiktokglobalshop.com/logistics/202309/delivery_options/${delivery_option_id}/shipping_providers`;
  const params = {
    app_key: config.app_key,
    shop_cipher: credentials.shopCipher,
    shop_id: "",
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
  let result = await axios.get(finalUrl, {
    headers: {
      "Content-Type": "application/json",
      "x-tts-access-token": accessToken,
    },
  });
  return result.data.data.shipping_providers;
};

const createProduct = async (product, credentials) => {
    const baseUrl =
      "https://open-api.tiktokglobalshop.com/product/202309/products";
    let accessToken = credentials.accessToken;
    const params = {
      app_key: config.app_key,
      shop_cipher: credentials.shopCipher,
      version: "202309",
      category_version: "v2", // Add this line for US shop
    };

    let variants = createVariants(product);

    const main_images = [];
    const color_images = {};
    const uploadedURLs = [];

    for (let variant of variants) {
      let imageKeys = ["front"];
      let color = variant.color;
      if (variant.selectedImageSides) imageKeys = variant.selectedImageSides;
      for (let key of imageKeys) {
        let url = variant.images[key];
        if (!url) continue;
        if (uploadedURLs.includes(url)) continue;
        uploadedURLs.push(url);
        if (url) {
          let uri = await uploadProductImage(url, credentials);

          if (!color_images[color.name]) {
            color_images[color.name] = uri;
          }
          main_images.push({
            uri,
          });
        }
      }
    }
    // for (let color of product.colors) {
    //   console.log(product, "product");
    //   let productImage = getProductImageUrl(product, color._id);
    //   console.log(productImage);
    //   if (productImage) {
    //     let uri = await uploadProductImage(productImage, credentials);
    //     color_images[color.name] = uri;
    //     main_images.push({
    //       uri,
    //     });
    //   }
    // }

    let category_id = "601226";
    if (
      product.name.toLowerCase().includes("hoodie") ||
      product.name.toLowerCase().includes("sweatshirt")
    ) {
      category_id = "601213";
    }
    if (product.name.toLowerCase().includes("mug")) {
      category_id = "600042";
    }
    if (product.name.toLowerCase().includes("coaster")) {
      category_id = "600033";
    }
    if (product.name.toLowerCase().includes("tank")) {
      category_id = "843400";
    }
    if (
      product.name.toLowerCase().includes("hat") ||
      product.name.toLowerCase().includes("visor")
    ) {
      category_id = "906248";
    }

    let rec = await getRecommendedCategory(product.name, credentials);

    let leafCategory = rec.filter((c) => c.is_leaf)[0];

    if (leafCategory) {
      category_id = leafCategory.id;
    }
    const warehouses = await getWarehouses(credentials);
    let warehouse_id = warehouses.find((w) => w.is_default == true).id;

    const body = {
      save_mode: "AS_DRAFT",
      description: product.style.description,
      category_id: category_id,
      main_images: main_images,
      skus: variants.map((v) => {
        return {
          inventory: [
            {
              warehouse_id: warehouse_id,
              quantity: 999,
            },
          ],
          price: { amount: v.price.toFixed(2), currency: "USD" },
          seller_sku: v.sku,
          sales_attributes: [
            {
              name: "Color",
              value_name: v.color.name,
              sku_img: {
                uri: color_images[v.color.name],
              },
            },
            {
              name: "Size",
              value_name: v.size.name,
            },
          ],
        };
      }),
      title: product.name,
      package_weight: {
        value: "0.5",
        unit: "POUND",
      },
      package_dimensions: {
        width: "6",
        height: "1",
        length: "6",
        unit: "INCH",
      },
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
    let result = await axios.post(finalUrl, body, {
      headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": accessToken,
      },
    });
  };
  const FormData = require("form-data");
  const fs = require("fs");
  const path = require("path");
  const uploadProductImage = async (uri, credentials) => {
    const baseUrl =
      "https://open-api.tiktokglobalshop.com/product/202309/images/upload";
    let accessToken = credentials.accessToken;
    const params = {
      app_key: config.app_key,
    };

    //download uri with axios and somehow turn into a file to upload view multipart form data below

    const response = await axios.get(uri, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    // Step 2: Convert the downloaded image into a file
    const tempFilePath = path.join(__dirname, "temp_image.jpg");
    fs.writeFileSync(tempFilePath, buffer);

    // Step 3: Create a FormData object
    const formData = new FormData();
    formData.append("data", fs.createReadStream(tempFilePath));
    formData.append("use_case", "MAIN_IMAGE");

    // Step 4: Prepare the request body and URL

    let signUrl = buildUrl(baseUrl, params);
    const { signature, timestamp } = tiktokShop.signByUrl(
      signUrl,
      config.app_secret
    );

    params["sign"] = signature;
    params["timestamp"] = timestamp;
    params["access_token"] = accessToken;
    let finalUrl = buildUrl(baseUrl, params);
    let result = await axios.post(finalUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        "x-tts-access-token": accessToken,
      },
    });
    return result.data.data.uri;
};

const getRecommendedCategory = async (product_name, credentials) => {
  const baseUrl =
    "https://open-api.tiktokglobalshop.com/product/202309/categories/recommend";
  let accessToken = credentials.accessToken;
  const params = {
    app_key: config.app_key,
    shop_cipher: credentials.shopCipher,
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

  let result = await axios.post(finalUrl, body, {
    headers: {
      "Content-Type": "application/json",
      "x-tts-access-token": accessToken,
    },
  });
  return result.data.data.categories;
};

const getCategories = async (credentials) => {
  const baseUrl = `https://open-api.tiktokglobalshop.com/product/202309/categories`;
  let accessToken = credentials.accessToken;
  const params = {
    app_key: config.app_key,
    shop_cipher: credentials.shopCipher,
    // shop_id: '',
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
  let result = await axios.get(finalUrl, {
    headers: {
      "Content-Type": "application/json",
      "x-tts-access-token": accessToken,
    },
  });
  const fs = require("fs");
  fs.writeFileSync(
    "./categoriesv2.json",
    JSON.stringify(result.data.data.categories)
  );
};

const getWarehouses = async (credentials) => {
  const baseUrl = `https://open-api.tiktokglobalshop.com/logistics/202309/warehouses`;
  let accessToken = credentials.accessToken;
  const params = {
    app_key: config.app_key,
    shop_cipher: credentials.shopCipher,
    // shop_id: '',
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
  let result = await axios.get(finalUrl, {
    headers: {
      "Content-Type": "application/json",
      "x-tts-access-token": accessToken,
    },
  });
  return result.data.data.warehouses;
};

const stateAbbreviations = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District Of Columbia": "DC",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

const updateTrackingDetails = async (order_id, tikTokOrder, credentials) => {
  let order = await Order.findOne({ _id: order_id }).lean();
  let trackingNumber = order.shippingInfo?.labels?.[0]?.trackingNumber;
  let provider = order.selectedShipping.provider;
  if (trackingNumber && provider) {
    const shippingOptions = await getShippingProviders(
      tikTokOrder.delivery_option_id,
      credentials
    );
    let shippingProvider = shippingOptions.filter(
      (opt) => opt.name.toLowerCase() == provider.toLowerCase()
    )[0];
    let tiktok_order_id = tikTokOrder.id;
    await fulfillOrder(
      tiktok_order_id,
      trackingNumber,
      shippingProvider.id,
      credentials
    );
  }
};

const fetchOrders = async () => {
  let credentialInfo = await TikTokCredentials.find().lean();
  for (let credentials of credentialInfo) {
    let user = await User.findOne({ _id: credentials.user })
      .lean()
      .select("email");
    console.log("fulfilling tiktok orders for", user.email);
    try {
      const unfulfilledOrders = await getOrders(null, credentials);
      if (!unfulfilledOrders) continue;

      const orders = [];
      for (let order of unfulfilledOrders) {
        try {
          let poNumber = `TIKTOK_${order.id}`;

          let exists = await checkIfOrderExists({
            poNumber,
            addressLine1: order.recipient_address.address_line1,
          });

          if (exists) {
            await updateTrackingDetails(exists._id, order, credentials);
            continue;
          }
          console.log("creating order", poNumber);
          const stateAbbr =
            stateAbbreviations[
              order.recipient_address.district_info[1].address_name
            ] || order.recipient_address.district_info[1].address_name; // Convert state name to abbreviation

          let items = await buildMarketplaceFulfillmentItems(
            order.line_items.map((i) => ({
              sku: i.seller_sku,
              quantity: 1,
            })),
            user
          );
          let sendOrder = {
            poNumber,
            shippingType: "Standard",
            shippingAddress: {
              name: order.recipient_address.name,
              address1: order.recipient_address.address_line1,
              address2: order.recipient_address.address_line2,
              city: order.recipient_address.district_info[3].address_name,
              state: stateAbbr,
              zip: order.recipient_address.postal_code,
              country: "US",
            },
            items,
            marketplace: "TIKTOK",
            marketplaceOrderId: order.id,
          };
          if (sendOrder.items.length) {
            orders.push(sendOrder);
          } else {
            console.error(
              "No Items Found for Order",
              order.line_items.map((l) => l.seller_sku)
            );
          }
        } catch (e) {
          console.log(e);
        }
      }
      console.log("Creating", orders.length, "TikTok Orders");
      for (let order of orders) {
        await createOrder(order, user._id);
      }
    } catch (err) {
      console.log(err);
      const updateCredentials = async (id) => {
        await getAccessTokenFromRefreshToken(id);
      };
      updateCredentials(credentials._id);
      console.error("Error parsing orders:", err);
    }
  }
};

export const tiktokApi = {
  getOrders,
  getShippingProviders,
  fulfillOrder,
  createProduct,
  getAccessTokenFromRefreshToken,
  getAccessTokenUsingAuthCode,
  getAuthorizedShops,
  generateAuthorizationUrl,
  fetchOrders,
};
