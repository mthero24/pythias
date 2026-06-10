import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";
import {Order, Products, Item, Inventory, ProductInventory} from "@pythias/mongo"
import { generatePieceID } from "./createPiceId.js";
export const getEtsyTaxonomyAttributes = async (taxonomy_id = 482) => {
    const clientId = process.env.etsyApiKey?.split(":")[0];
    let errData;
    const res = await axios.get(
        `https://openapi.etsy.com/v3/application/seller-taxonomy/nodes/${taxonomy_id}/properties`,
        { headers: { "x-api-key": clientId } }
    ).catch(e => { errData = e.response?.data; });
    if (errData) return { error: true, msg: errData.error ?? "Failed to fetch Etsy attributes" };
    return { error: false, taxonomy_id, attributes: res.data.results ?? [] };
};

export const getToken = async (code, baseUrl) => {
    const authCode = code;
    const tokenUrl = "https://api.etsy.com/v3/public/oauth/token";
    const clientId = process.env.etsyApiKey?.split(":")[0];
    const requestOptions = {
        method: "POST",
        body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: clientId,
            redirect_uri: `${baseUrl}/api/integrations/etsy/redirect`,
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
                client_id: clientId,
                redirect_uri: `${baseUrl}/api/integrations/etsy/redirect`,
                code: authCode,
                code_verifier: base64URLEncode("nicepajamas"),
            },
            { headers: requestOptions.headers }
        );
        return response.data;
    } catch (e) {

        console.log(e);
        notify("etsy", e.toString());
    }
};

export const refreshToken = async (refreshToken) => {
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
        },
    };
    let url = `https://api.etsy.com/v3/public/oauth/token`;
    let response = await axios.post(
        url,
        {
            grant_type: "refresh_token",
            client_id: `${process.env.etsyApiKey.split(":")[0]}`,
            refresh_token: refreshToken,
        },
        requestOptions
    ).catch((err) => console.log(err.response.data));

    //console.log(response.data);
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

    
    const clientId = process.env.etsyApiKey?.split(":")[0];
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3006/api/admin/integrations/etsy/oauth/redirect&scope=email_r%20address_r%20transactions_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=${clientId}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    //transactions_r%20email_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w
};
const base64URLEncode = (str) =>
    str
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

export const uploadListingImage = async (
    credentials,
    listing_id,
    formData,
) => {
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
            ...formData.getHeaders(),
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/listings/${listing_id}/images`;
    let response = await axios.post(url, formData, requestOptions).catch((err) => { console.log(err.response.data) });
    return response;
};

const uploadListingVideo = async (credentials, listing_id, videoUrl) => {
    const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer" });
    const videoBuffer = Buffer.from(videoResponse.data);
    const filename = videoUrl.split("/").pop().split("?")[0] || "video.mp4";
    const formData = new FormData();
    formData.append("name", filename);
    formData.append("video", videoBuffer, { filename, contentType: "video/mp4" });
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
            ...formData.getHeaders(),
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/listings/${listing_id}/videos`;
    let response = await axios.post(url, formData, requestOptions).catch((err) => { console.log(err?.response?.data) });
    return response;
};

const getShopShippingProfiles = async (credentials) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/shipping-profiles`;
    let errData
    let response = await axios.get(url, requestOptions).catch((err) => {
        errData = err.response.data;
    });
    if(errData){
        if(errData.error === "invalid_token" || errData.error.includes("Invalid access token")){
            let newTokens = await refreshToken(credentials.refreshToken);
            if(newTokens){
                credentials.apiKey = newTokens.access_token;
                credentials.refreshToken = newTokens.refresh_token;
                await credentials.save();
                const requestOptions = {
                    headers: {
                        "x-api-key": `${process.env.etsyApiKey}`,
                        Authorization: `Bearer ${credentials.apiKey}`,
                    },
                };
                let response = await axios.get(url, requestOptions).catch((err) => {
                    errData = err.response.data;
                });
                return {shippingProfiles: response.data, updatedCredentials: credentials};
            }
        }
    }
    //console.log(response && response.data);
    return { shippingProfiles: response.data, shippingProfiles2: response.data, updatedCredentials: credentials };
};
const createShopShippingProfile = async (credentials) => {
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/shipping-profiles`;
    let address = JSON.parse(process.env.businessAddress);
    let shippingProfile = {
        title: "Pythias",
        origin_country_iso: "US",
        destination_country_iso: "US",
        origin_postal_code: address.postalCode,
        primary_cost: 0,
        secondary_cost: 0,
        min_processing_time: 1,
        max_processing_time: 3,
        min_delivery_days: 2,
        max_delivery_days: 5,
    };
    let errData
    let response = await axios
        .post(url, shippingProfile, requestOptions)
        .catch((err) => {
            console.log(err)
            errData = err.response.data;
        });
    if (errData) {
        if (errData.error === "invalid_token" || errData.error.includes("Invalid access token")) {
            let newTokens = await refreshToken(credentials.refreshToken);
            if (newTokens) {
                credentials.apiKey = newTokens.access_token;
                credentials.refreshToken = newTokens.refresh_token;
                await credentials.save();
                const requestOptions = {
                    headers: {
                        "x-api-key": `${process.env.etsyApiKey}`,
                        Authorization: `Bearer ${credentials.apiKey}`,
                    },
                };
                response = await axios
                    .post(url, shippingProfile, requestOptions)
                    .catch((err) => {
                        console.log(err.response.data);
                    });
            }
        }
    }
    return {res: response.data, updatedCredentials2: credentials};
};
const getShopReturnPolicies = async (credentials) => {
    
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/policies/return`;
    let errData
    let response = await axios.get(url, requestOptions).catch((err) => {
        
        errData = err.response.data;
    });
    if (errData) {
        if (errData.error === "invalid_token" || errData.error.includes("Invalid access token")) {
            let newTokens = await refreshToken(credentials.refreshToken);
            if (newTokens) {
                credentials.apiKey = newTokens.access_token;
                credentials.refreshToken = newTokens.refresh_token;
                await credentials.save();
                const requestOptions = {
                    headers: {
                        "x-api-key": `${process.env.etsyApiKey}`,
                        Authorization: `Bearer ${credentials.apiKey}`,
                    },
                };
                response = await axios.get(url, requestOptions);
            }
        }
    }
    return {returnPolicies: response.data, updatedCredentials: credentials};
};

const getRedinessStates = async (credentials) => {
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/readiness-state-definitions`; 
    let errData
    let response = await axios.get(url, requestOptions).catch((err) => {
        
        errData = err.response.data;
    });
    if (errData) {
        if (errData.error === "invalid_token" || errData.error.includes("Invalid access token")) {
            let newTokens = await refreshToken(credentials.refreshToken);
            if (newTokens) {
                credentials.apiKey = newTokens.access_token;
                credentials.refreshToken = newTokens.refresh_token;
                await credentials.save();
                const requestOptions = {
                    headers: {
                        "x-api-key": `${process.env.etsyApiKey}`,
                        Authorization: `Bearer ${credentials.apiKey}`,
                    },
                };
                response = await axios.get(url, requestOptions);
            }
        }
    }
    return { readinessStates: response.data, readinessStates2: response.data, updatedCredentials: credentials};
};

const createRedinessState = async (credentials) => {
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/readiness-state-definitions`;
    let errData
    let response = await axios.post(url, {
        readiness_state: "made_to_order",
        min_processing_time: 1,
        max_processing_time: 3,
    }, requestOptions).catch((err) => {
        errData = err.response.data;
    });
    if (errData) {
        if (errData.error === "invalid_token" || errData.error.includes("Invalid access token")) {
            let newTokens = await refreshToken(credentials.refreshToken);
            if (newTokens) {
                credentials.apiKey = newTokens.access_token;
                credentials.refreshToken = newTokens.refresh_token;
                await credentials.save();
                const requestOptions = {
                    headers: {
                        "x-api-key": `${process.env.etsyApiKey}`,
                        Authorization: `Bearer ${credentials.apiKey}`,
                    },
                };
                response = await axios.post(url, {
                    readiness_state: "made_to_order",
                    min_processing_time: 1,
                    max_processing_time: 3,
                }, requestOptions).catch((err) => {
                    errData = err.response.data;
                });
            }
        }
    }
    return {listing: response.data, updatedCredentials: credentials};
}
const createListing = async (product, returnPolicyId, shipping_profile_id, credentials, marketplaceValues = {}) => {
    let {readinessStates, updatedCredentials} = await getRedinessStates(credentials);
    credentials = updatedCredentials;
    if (readinessStates.count == 0) {
        let {response, updatedCredentials2} = await createRedinessState(credentials);
        credentials = updatedCredentials2;
        let { readinessStates2, updatedCredentials } = await getRedinessStates(credentials);
        readinessStates = readinessStates2;
        credentials = updatedCredentials;
    }
    let taxonomy_id = 449; // default to mens tshirts
    console.log(product.gender, product.marketplaceValues["6962a83c1ef040caf90d95cb"]?.gender, product.blanks[0].department, "+++++++");
    console.log((product.gender?.toLowerCase() == "female" || (product.marketplaceValues && product.marketplaceValues["6962a83c1ef040caf90d95cb"]?.gender?.toLowerCase() == "female")) && product.blanks[0].department == "Kids")
    if ((product.gender?.toLowerCase() === "male" || (product.marketplaceValues && product.marketplaceValues["6962a83c1ef040caf90d95cb"]?.gender?.toLowerCase() == "male")) && (product.blanks[0].department == "Adult" || product.blanks[0].department == "Mens")) {
        if(product.blanks[0].category[0].includes("T-Shirts"))taxonomy_id = taxonomyIds.mensTshirts;
        if(product.blanks[0].category[0].includes("Tank Tops"))taxonomy_id = taxonomyIds.mensTanks;
        if(product.blanks[0].category[0].includes("Long Sleeve Shirts"))taxonomy_id = taxonomyIds.mensLongSleeveShirts;
        if(product.blanks[0].category[0].includes("Hoodies"))taxonomy_id = taxonomyIds.mensHoodies;
        if(product.blanks[0].category[0].includes("Sweatshirts"))taxonomy_id = taxonomyIds.mensSweatshirts;
    } else if ((product.gender?.toLowerCase() === "female" || (product.marketplaceValues && product.marketplaceValues["6962a83c1ef040caf90d95cb"]?.gender?.toLowerCase() == "female")) && (product.blanks[0].department == "Adult" || product.blanks[0].department == "Womens")){
        if(product.blanks[0].category[0].includes("T-Shirts"))taxonomy_id = taxonomyIds.womensTshirts;
        if(product.blanks[0].category[0].includes("Tank Top"))taxonomy_id = taxonomyIds.womensTanks;
        if(product.blanks[0].category[0].includes("Long Sleeve Shirt"))taxonomy_id = taxonomyIds.womensLongSleeveShirts;
        if(product.blanks[0].category[0].includes("Hoodie"))taxonomy_id = taxonomyIds.womensHoodies;
        if(product.blanks[0].category[0].includes("Sweatshirt"))taxonomy_id = taxonomyIds.womensSweatshirts;
    } else if ((product.gender?.toLowerCase() === "unisex" || (product.marketplaceValues && product.marketplaceValues["6962a83c1ef040caf90d95cb"]?.gender?.toLowerCase() == "unisex")) && (product.blanks[0].department == "Adult" || product.blanks[0].department == "Mens" || product.blanks[0].department == "Womens")){
        if(product.blanks[0].category[0].includes("T-Shirts"))taxonomy_id = taxonomyIds.unisexTshirts;
        if(product.blanks[0].category[0].includes("Tank Tops"))taxonomy_id = taxonomyIds.unisexTanks;
        if(product.blanks[0].category[0].includes("Long Sleeve Shirt"))taxonomy_id = taxonomyIds.unisexLongSleeveShirts;
        if(product.blanks[0].category[0].includes("Hoodie"))taxonomy_id = taxonomyIds.unisexHoodies;
        if(product.blanks[0].category[0].includes("Sweatshirt"))taxonomy_id = taxonomyIds.unisexSweatshirts;
    } else if ((product.gender?.toLowerCase() == "male" || (product.marketplaceValues && product.marketplaceValues["6962a83c1ef040caf90d95cb"]?.gender?.toLowerCase() == "male")) && product.blanks[0].department == "Kids"){
        if(product.blanks[0].category[0].includes("T-Shirt"))taxonomy_id = taxonomyIds.boysTshirts;
        if(product.blanks[0].category[0].includes("Tank Top"))taxonomy_id = taxonomyIds.boysTanks;
        if(product.blanks[0].category[0].includes("Long Sleeve Shirt"))taxonomy_id = taxonomyIds.boysLongSleeveShirts;
        if(product.blanks[0].category[0].includes("Hoodie"))taxonomy_id = taxonomyIds.boysHoodies;
        if(product.blanks[0].category[0].includes("Sweatshirt"))taxonomy_id = taxonomyIds.boysSweatshirts;
        if(product.blanks[0].category[0].includes("Bodysuit"))taxonomy_id = taxonomyIds.boysBodiesuits;
    } else if ((product.gender?.toLowerCase() == "female" || (product.marketplaceValues && product.marketplaceValues["6962a83c1ef040caf90d95cb"]?.gender?.toLowerCase() == "female")) && product.blanks[0].department == "Kids"){
        //console.log("here++++++++++++++", product.blanks[0].category.includes("Hoodie"), product.blanks[0].category[0])
        if (product.blanks[0].category[0].includes("T-Shirt"))taxonomy_id = taxonomyIds.girlsTshirts;
        if (product.blanks[0].category[0].includes("Tank Top"))taxonomy_id = taxonomyIds.girlsTanks;
        if(product.blanks[0].category[0].includes("Long Sleeve Shirt"))taxonomy_id = taxonomyIds.girlsLongSleeveShirts;
        if (product.blanks[0].category[0].includes("Hoodie"))taxonomy_id = taxonomyIds.girlsHoodies;
        if (product.blanks[0].category[0].includes("Sweatshirt"))taxonomy_id = taxonomyIds.girlsSweatshirts;
        if(product.blanks[0].category[0].includes("Bodysuit"))taxonomy_id = taxonomyIds.girlsBodiesuits;
        //console.log(taxonomy_id, "taxonomy_id");
    } else if ((product.gender?.toLowerCase() == "unisex" || (product.marketplaceValues && product.marketplaceValues["6962a83c1ef040caf90d95cb"]?.gender?.toLowerCase() == "unisex")) && product.blanks[0].department == "Kids"){ 
        if(product.blanks[0].category[0].includes("T-Shirt"))taxonomy_id = taxonomyIds.unisexKidsTshirts;
        if(product.blanks[0].category[0].includes("Tank Top"))taxonomy_id = taxonomyIds.unisexKidsTanks;
        if(product.blanks[0].category[0].includes("Long Sleeve Shirt"))taxonomy_id = taxonomyIds.unisexKidsLongSleeveShirts;
        if(product.blanks[0].category[0].includes("Hoodie"))taxonomy_id = taxonomyIds.unisexKidsHoodies;
        if(product.blanks[0].category[0].includes("Sweatshirt"))taxonomy_id = taxonomyIds.unisexKidsSweatshirts;
        if(product.blanks[0].category[0].includes("Bodysuit"))taxonomy_id = taxonomyIds.unisexKidsBodiesuits;
    }
    console.log(taxonomy_id, "taxonomy_id");
    let listing = {
        quantity: 999,
        title: product.title,
        shipping_profile_id: shipping_profile_id,
        description: product.description,
        sku: product.sku || "N/A",
        price: (product.sizes[0]?.retailPrice ?? 25).toFixed(2),
        who_made: "someone_else",
        when_made: "made_to_order",
        taxonomy_id: taxonomy_id,
        return_policy_id: returnPolicyId,
        processing_min: 1,
        processing_max: 3,
        materials: product.materials || ["cotton"],
        item_weight: product.sizes[0]?.weight ?? 0.2,
        item_weight_unit: "oz",
        item_length: parseFloat(product.packageLength ?? marketplaceValues["Package Length"] ?? 13),
        item_width:  parseFloat(product.packageWidth  ?? marketplaceValues["Package Width"]  ?? 9),
        item_height: parseFloat(product.packageHeight ?? marketplaceValues["Package Height"] ?? 0.5),
        item_dimensions_unit: "in",
        should_auto_renew: true,
        is_taxable: true,
        tags: (() => {
            const SKIP = new Set(["name","titleGenerator","Package Length","Package Width","Package Height"]);
            const mpTags = Object.entries(marketplaceValues)
                .filter(([k, v]) => v && !SKIP.has(k))
                .map(([, v]) => String(v).toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().slice(0, 20))
                .filter(Boolean);
            return [...new Set([
                ...product.tags.filter(t => t && t.length > 0 && t.length < 20 && !t.match(/[^a-zA-Z0-9 ]/gi)),
                ...mpTags,
            ])].slice(0, 13);
        })(),
        is_supply: false,
        type: "physical",
        readiness_state_id: readinessStates.results[0].readiness_state_id,
        // taxonomy_id: 374 /* 2830?? */,
    };
    //console.log(listing);
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/listings`;
    let errData
    let response = await axios.post(url, listing, requestOptions).catch((err) => {
        errData = err.response.data;
    });
    if (errData) {
        if (errData.error === "invalid_token" || errData.error.includes("Invalid access token")) {
            let newTokens = await refreshToken(credentials.refreshToken);
            if (newTokens) {
                credentials.apiKey = newTokens.access_token;
                credentials.refreshToken = newTokens.refresh_token;
                await credentials.save();
                const requestOptions = {
                    headers: {
                        "x-api-key": `${process.env.etsyApiKey}`,
                        Authorization: `Bearer ${credentials.apiKey}`,
                    },
                };
                response = await api.post(url, listing, requestOptions)
            }
        }
    }
    //console.log(response.data);
    return {listing: response.data, updatedCredentials: credentials};
}

const getListingInventory = async (listing_id, credentials) => {
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    };
    let url = `https://openapi.etsy.com/v3/application/listings/${listing_id}/inventory?legacy=false`;
    let errData
    let response = await axios.get(url, requestOptions).catch((err) => {
        errData = err.response.data;
    });
    if (errData) {
        if (errData.error === "invalid_token" || errData.error.includes("Invalid access token")) {
            let newTokens = await refreshToken(credentials.refreshToken);
            if (newTokens) {
                credentials.apiKey = newTokens.access_token;
                credentials.refreshToken = newTokens.refresh_token;
                await credentials.save();
                const requestOptions = {
                    headers: {
                        "x-api-key": `${process.env.etsyApiKey}`,
                        Authorization: `Bearer ${credentials.apiKey}`,
                    },
                };
                response = await axios.get(url, requestOptions)
            }
        }
    }
    return {getInventory: response.data, updatedCredentials2: credentials};
};

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

const updateListing = async (
    credentials,
    listing_id,
    product,
    
) => {
    let variants = product.variantsArray;
    for(let v of variants){
        let blank = product.blanks.find(b => b._id.toString() === v.blank.toString());
        if(!v.size.name) v.size = blank.sizes.find(s => s._id.toString() === v.size.toString());
        if(!v.blank.name) v.blank = blank;
        if(!v.color.name) v.color = blank.colors.find(c => c._id.toString() === v.color.toString());
    }
    let { readinessStates, updatedCredentials } = await getRedinessStates(credentials);
    credentials = updatedCredentials;
    if (readinessStates.count == 0) {
        let { response, updatedCredentials2 } = await createRedinessState(credentials);
        credentials = updatedCredentials2;
        let { readinessStates2, updatedCredentials } = await getRedinessStates(credentials);
        readinessStates = readinessStates2;
        credentials = updatedCredentials;
    }
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    };
    let url = `https://openapi.etsy.com/v3/application/listings/${listing_id}/inventory?legacy=false`;

    try {
        const imgRes = await axios.get(
            `https://openapi.etsy.com/v3/application/listings/${listing_id}/images`,
            { headers: requestOptions.headers }
        );
        for (let img of (imgRes.data.results || [])) {
            try {
                await axios.delete(
                    `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/listings/${listing_id}/images/${img.listing_image_id}`,
                    { headers: requestOptions.headers }
                );
                await new Promise(r => setTimeout(r, 300));
            } catch (e) {
                console.error("Failed to delete listing image:", e.message);
            }
        }
    } catch (e) {
        console.error("Failed to fetch existing listing images:", e.message);
    }

    let i = 0;
    let inventory = [];
    let colorImageCompleted = [];
    let hasSeconarySize = variants[0]?.secondarySize ? true : false;
    
    for (let variant of variants) {
        if (variant.sku.length > 32) {
            continue;
        }
        let size_name = variant.size.name;
        size_name = variant.size.name.replace("SM", "S");
        size_name = variant.size.name.replace("LG", "L");
        size_name = variant.size.name.replace("MD", "M");
        size_name = variant.size.name.toLowerCase().replace("2xl", "xxl");
        size_name = variant.size.name.toLowerCase().replace("5t", "5").replace("5/6T", "5");
        let size, color, secondarySize, threadColor;
        if (!size) {
            size = {
                value_id: 513,
                name: size_name.toUpperCase(),
                equal_to: [],
                order: 0,
            };
        }
        if (!color) {
            color = {
                value_id: 513,
                name: toTitleCase(variant.color.name + (threadColor ? ` with ${threadColor.name} ${product.design.printType == "EMB" ? "Thread color" : "Print color"}` : "")),
                equal_to: [],
                order: 0,
            };
        }
        if (variant.secondarySize) {
            secondarySize = {
                value_id: 513,
                name: variant.secondarySize.name.toUpperCase(),
                equal_to: [],
                order: 0,
            };
        }
        //console.log(size, color, secondarySize, "size color secondarySize+++++++");
        if (size && color) {
            
            let url = variant.image?.replace("width=400", "width=1200");
            if (!url) continue;
            if (!colorImageCompleted.includes(url) && i < 19) {
                i++;
                console.log(url, "url");
                try {
                    // Get image buffer using axios
                    const response = await axios.get(url, {
                        responseType: "arraybuffer",
                        timeout: 30000, // 30 second timeout
                    });
                    //console.log("Image fetched successfully", response.data, color.name);
                    let blob = await b64toBlob(response.data.toString('base64'), 'image/jpeg');
                   // console.log( "++++++++++++ ", i, "+++++++++++++++++++++" )
                    // Create form data with the image buffer
                    let formData = new FormData();
                    formData.append("listing_id", listing_id);
                    formData.append("rank", i);
                    formData.append("alt_text", `${color.name}`);
                    formData.append("image", Buffer.from(await blob.arrayBuffer()), {
                        filename: "etsy.jpg",
                    });

                    // Add retry logic for the upload
                    let retries = 3;
                    while (retries > 0) {
                        retries--;
                        try {
                            await new Promise((resolve) => setTimeout(resolve, 500));
                            let image = await uploadListingImage(
                                credentials,
                                listing_id,
                                formData,
                            )
                            colorImageCompleted.push(url);
                            break;
                        } catch (e) {
                            console.log(e)
                            if (retries === 0) {
                                console.error(
                                    `Failed to upload image after 3 attempts: ${e.message}`,
                                    color.name
                                );
                            }
                        }
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                } catch (e) {
                    colorImageCompleted.push(url);
                    console.error(`Failed to process image: ${e.message}`, color.name);
                }
                if(variant.images && variant.images.length > 0){
                    //console.log("here+++++++", variant.images.length);
                    for(let url of variant.images){
                        url = url.replace("width=400", "width=1200");
                        if (!colorImageCompleted.includes(url) && i < 19) {
                            i++;
                            try {
                                // Get image buffer using axios
                                const response = await axios.get(url, {
                                    responseType: "arraybuffer",
                                    timeout: 30000, // 30 second timeout
                                });
                                //console.log("Image fetched successfully", response.data, color.name);
                                let blob = await b64toBlob(response.data.toString('base64'), 'image/jpeg');
                                console.log("++++++++++++ ", i, "+++++++++++++++++++++")
                                // Create form data with the image buffer
                                let formData = new FormData();
                                formData.append("listing_id", listing_id);
                                formData.append("rank", i);
                                formData.append("alt_text", `${color.name}`);
                                formData.append("image", Buffer.from(await blob.arrayBuffer()), {
                                    filename: "etsy.jpg",
                                });

                                // Add retry logic for the upload
                                let retries = 3;
                                while (retries > 0) {
                                    retries--;
                                    try {
                                        await new Promise((resolve) => setTimeout(resolve, 500));
                                        let image = await uploadListingImage(
                                            credentials,
                                            listing_id,
                                            formData,
                                        )
                                        colorImageCompleted.push(url);
                                        break;
                                    } catch (e) {
                                        console.log(e)
                                        console.log(`Retrying image upload (${3 - retries}/3)`);
                                        if (retries === 0) {
                                            console.error(
                                                `Failed to upload image after 3 attempts: ${e.message}`,
                                                color.name
                                            );
                                        }
                                    }
                                }
                            } catch (e) {
                                colorImageCompleted.push(url);
                                console.error(`Failed to process image: ${e.message}`, color.name);
                            }
                            await new Promise((resolve) => setTimeout(resolve, 1000));
                        }
                    }
                }
            }
           
            let propertyValues = [
                {
                    property_id: 513,
                    value_ids: [size.value_id],
                    scale_id: secondarySize ? null : 19,
                    property_name: variant?.size?.styleName
                        ? `Size (${variant?.size.styleName})`.slice(0, 44)
                        : "Size",
                    values: [`${size.name}`],
                },
            ];

            if (secondarySize) {
                propertyValues.push({
                    property_id: 514,
                    value_ids: [secondarySize.value_id],
                    scale_id: null,
                    property_name: variant?.secondarySize?.styleName
                        ? `Size (${variant?.secondarySize?.styleName})`.slice(0, 44)
                        : "Size",
                    values: [`${secondarySize.name}`],
                });
            } else {
                propertyValues.push({
                    property_id: 200,
                    value_ids: [color.value_id],
                    property_name: "Primary color",
                    values: [`${color.name}`],
                });
            }
            let inventoryItem = {
                sku: variant.sku,
                property_values: propertyValues,
                offerings: [
                    {
                        price: variant.price,
                        quantity: 100,
                        is_enabled: true,
                        readiness_state_id: readinessStates.results[0].readiness_state_id,
                    },
                ],
            };

            inventory.push(inventoryItem);
        }
    }
    const sizeGuideUrl = variants[0].blank.sizeGuide.images[0];
    if (sizeGuideUrl && !colorImageCompleted.includes(sizeGuideUrl)) {
        i = Math.max(i + 1, 2);
        try {
            // Get image buffer using axios
            let url = sizeGuideUrl;
            const response = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 30000, // 30 second timeout
            });
            //console.log("Image fetched successfully", response.data, color.name);
            let blob = await b64toBlob(response.data.toString('base64'), 'image/jpeg');
            // Create form data with the image buffer
            let formData = new FormData();
            formData.append("listing_id", listing_id);
            formData.append("rank", i);
            formData.append("alt_text", `size guide`);
            formData.append("image", Buffer.from(await blob.arrayBuffer()), {
                filename: "etsy.jpg",
            });

            // Add retry logic for the upload
            let retries = 3;
            while (retries > 0) {
                retries--;
                try {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    let image = await uploadListingImage(
                        credentials,
                        listing_id,
                        formData,
                    )
                    colorImageCompleted.push(url);
                    break;
                } catch (e) {
                    console.log(e)
                    console.log(`Retrying image upload (${3 - retries}/3)`);
                    if (retries === 0) {
                        console.error(
                            `Failed to upload image after 3 attempts: ${e.message}`,
                            `size guide`
                        );
                    }
                }
            }
        } catch (e) {
            colorImageCompleted.push(url);
            console.error(`Failed to process image: ${e.message}`, `size guide`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const videoUrl = product.video || product.blanks?.[0]?.videos?.[0];
    if (videoUrl) {
        try {
            await uploadListingVideo(credentials, listing_id, videoUrl);
        } catch (e) {
            console.error("Failed to upload listing video:", e.message);
        }
    }

    inventory.sort(
        (a, b) =>
            a.property_values[0].value_ids[0] - b.property_values[0].value_ids[0]
    );

    let propertyPrices = inventory[0].property_values.map((p) => p.property_id);

    let updateInventory = {
        products: inventory,
        price_on_property: propertyPrices,
        sku_on_property: propertyPrices,
        quantity_on_property: propertyPrices,
    };

    await new Promise((resolve) => setTimeout(resolve, 500));
    let response = await axios.put(url, updateInventory, requestOptions).catch(e=> console.log(e.response.data));
    //console.log(response.data, "response data+++++++");
    return response.data;
};

export const updateListingFrom = async (listing_id, product, credentials)=> {
    let { getInventory, updatedCredentials2 } = await getListingInventory(
        listing_id,
        credentials
    );
    credentials = updatedCredentials2;
    await updateListing(
        credentials,
        listing_id,
        product,
        getInventory.products[0].product_id,
    );
}
export const createDraftListing = async (product, credentials, marketplaceValues = {}) => {
    let access_token = credentials.apiKey;
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${access_token}`,
        },
    };
    
    let {shippingProfiles, updatedCredentials} = await getShopShippingProfiles(
        credentials
    );
    //console.log(updatedCredentials, "updatedCredentials+++++++");
    credentials = updatedCredentials;
   // console.log(shippingProfiles, "shippingProfiles");
    if (shippingProfiles.count == 0 || shippingProfiles.results.filter((p) => p.title == "Pythias").length ==
        0){
        let {res, updatedCredentials2} = await createShopShippingProfile(
            credentials
        );
        credentials = updatedCredentials2;
        //console.log(res, "res+++++++");
        let { shippingProfiles2, updatedCredentials } = await getShopShippingProfiles(
            credentials
        );
        credentials = updatedCredentials;
        shippingProfiles = shippingProfiles2;
    }
    let shipping_profile_id = shippingProfiles.results.filter(
        (p) => p.title == "Pythias"
    )[0].shipping_profile_id;

    let returnPolicyId;
    try {
        let {returnPolicies, updatedCredentials} = await getShopReturnPolicies(
            credentials
        );
        credentials = updatedCredentials;
        //console.log(returnPolicies);

        returnPolicyId = returnPolicies?.results?.[0]?.return_policy_id;
    } catch (e) {
        console.log(e);
    }
    //console.log(returnPolicyId, "returnPolicyId+++++++");
    if(returnPolicyId && shipping_profile_id){
        let response = await createListing(
            product,
            returnPolicyId,
            shipping_profile_id,
            credentials,
            marketplaceValues
        );
        let listing = response.listing;
        credentials = response.updatedCredentials;
        let {getInventory, updatedCredentials2} = await getListingInventory(
            listing.listing_id,
            credentials
        );
        credentials = updatedCredentials2;
        await updateListing(
            credentials,
            listing.listing_id,
            product,
            getInventory.products[0].product_id,
        );
        return listing.listing_id;
    }

};
const getTaxonomyId = async () => {
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
        }
    };
    let url = `https://openapi.etsy.com/v3/application/seller-taxonomy/nodes`
    let response = await axios.get(url, requestOptions);
    let clothing = response.data.results.filter(r => r.name.toLowerCase().includes("clothing"))[0];
    let children = clothing.children;
    let mens = children.filter(c => c.name.toLowerCase().includes("women's clothing"))[0];
    let womens = children.filter(c => c.name.toLowerCase().includes("women's clothing"))[0];

};
const taxonomyIds ={
    mensTshirts: 449,
    mensTanks: 448,
    mensLongSleeveShirts: 449,
    mensHoodies: 1852,
    mensSweatshirts: 2201,
    womensHoodies: 1855,
    womensSweatshirts: 2198,
    womensBlouses: 553,
    womensCropTops: 555,
    womensHalterTops: 556,
    womensPolos: 557,
    womensTshirts: 559,
    womensTanks: 558,
    womensLongSleeveShirts: 559,
    womensTunics: 560,
    unisexTshirts: 482,
    unisexTanks: 481,
    unisexLongSleeveShirts: 482,
    unisexHoodies: 1853,
    unisexSweatshirts: 2202,
    boysTshirts: 11136,
    boysTanks: 11135,
    boysLongSleeveShirts: 11136,
    boysHoodies: 2187,
    boysSweatshirts: 2188,
    boysBodiesuits: 387,
    girlsTshirts: 11143,
    girlsTanks: 11142,
    girlsLongSleeveShirts: 11136,
    girlsHoodies: 1851,
    girlsSweatshirts: 2200,
    girlsBodiesuits: 416,
    unisexKidsTshirts: 11170,
    unisexKidsTanks: 11172,
    unisexKidsLongSleeveShirts: 11136,
    unisexKidsHoodies: 1854,
    unisexKidsSweatshirts: 2203,
    unisexKidsBodiesuits: 486,

}

const getShopReceipts = async (credentials) => {
  let params = {
    was_paid: true,
    was_shipped: false,
  };
  await new Promise((resolve) => setTimeout(resolve, 500));
  const response = await axios.get(`https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/receipts`, {
    headers: {
        "x-api-key": `${process.env.etsyApiKey}`,
        Authorization: `Bearer ${credentials.apiKey}`,
    },
    params,
  });
  return response.data;
};

const createItemVariant = async (variant, product, order) => {
    let item = new Item({
        pieceId: await generatePieceID(),
        paid: true,
        sku: variant.sku,
        orderItemId: variant.orderItemId,
        blank: variant.blank,
        styleCode: variant.blank?.code,
        sizeName: variant.size && variant.size.name ? variant.size.name : variant.blank?.sizes.find(s => s._id.toString() == variant.size)?.name,
        threadColorName: variant.threadColor?.name,
        threadColor: variant.threadColor,
        colorName: variant.color?.name,
        color: variant.color,
        size: variant.size,
        design: variant.threadColor ? product.design.threadImages[variant.threadColor?.name] : product.design?.images,
        designRef: product.design,
        order: order._id,
        shippingType: order.shippingType,
        quantity: 1,
        status: order.status,
        name: variant.name,
        date: order.date,
        type: product.design?.printType,
        upc: variant.upc,
        isBlank: product.design ? false : true,
    })
    item = await item.save();
    let productInventory = await ProductInventory.findOne({ sku: item.sku })
    if (productInventory && productInventory.quantity - productInventory.inStock.length > 0) {
        if (productInventory.quantity > 0) {
            item.inventory.inventoryType = "productInventory"
            item.inventory.productInventory = productInventory._id
            productInventory.inStock.push(item._id.toString())
            await productInventory.save()
        }
    } else {
        let inventory = await Inventory.findOne({ blank: item.blank, color: item.color, sizeId: item.size })
        if (!inventory) {
            inventory = await Inventory.findOne({ inventory_id: `${item.colorName}-${item.sizeName}-${item.styleCode}` })
        }
        if (inventory) {
            if (!item.inventory) item.inventory = {}
            item.inventory.inventoryType = "inventory"
            item.inventory.inventory = inventory._id
        }
    }
    return item
}

const buildMarketplaceFulfillmentItems = async (sku, quantity, order) => {
    let items = []
    let product = await Products.findOne({ variantsArray: { $elemMatch: { sku: sku } } }).populate("design", "sku images").populate("design variantsArray.blank variantsArray.color").populate("blanks colors threadColors design")
    if(product){
        let variant = product.variantsArray.find(v => v.sku === sku)
        for(let i = 0; i < quantity; i++){
            let item = await createItemVariant(variant, product, order)
            items.push(item)
        }
    }
    return items
}
export const fetchOrders = async (credentials) => {
    try {
        let refresh = await refreshToken(credentials.refreshToken);
        credentials.apiKey = refresh.access_token;
        credentials.refreshToken = refresh.refresh_token;
        await credentials.save();
        let receipts = await getShopReceipts(credentials);
        for (let etsy_order of receipts.results) {
            try {
                if (etsy_order.status == "Canceled") continue;
                const receiptId = etsy_order.receipt_id.toString();
                let order = await Order.findOne({ poNumber: receiptId });
                if (!order) {
                    let items = [];
                    order = new Order({
                        poNumber: receiptId,
                        orderId: receiptId,
                        shippingAddress: {
                            name: etsy_order["name"],
                            address1: etsy_order["first_line"] || "not provided",
                            address2: etsy_order["second_line"],
                            city: etsy_order["city"] || "not provided",
                            zip: etsy_order["zip"] || "not provided",
                            state: etsy_order["state"] || "not provided",
                            country: etsy_order["country_iso"] || "not provided",
                        },
                        status: "Paid",
                        marketplace: "etsy",
                        shippingType: "Standard",
                        paid: true,
                    });
                    for (let trans of etsy_order.transactions) {
                        let itms = await buildMarketplaceFulfillmentItems(trans.sku, trans.quantity, order);
                        items = [...items, ...itms];
                    }
                    order.items = items;
                    await order.save();
                }
            } catch (err) {
                console.log(err);
            }
        }
    } catch (err) {
        console.log(err);
    }
};

// Refresh token + fetch open (paid, not shipped) receipts.
// credentials must be a live Mongoose document so save() works.
export const getOpenReceiptsEtsy = async (credentials) => {
    try {
        const refresh = await refreshToken(credentials.refreshToken);
        if (refresh?.access_token) {
            credentials.apiKey = refresh.access_token;
            credentials.refreshToken = refresh.refresh_token;
            await credentials.save();
        }
    } catch (e) {
        console.error("Etsy token refresh failed:", e.message);
    }
    return getShopReceipts(credentials);
};

export const createReceiptShipment = async (credentials, receiptId, trackingCode, carrier) => {
    const carrierMap = { usps: "usps", ups: "ups", fedex: "fedex", dhl: "dhl", ontrac: "ontrac" };
    const carrier_name = carrierMap[carrier?.toLowerCase()] || carrier;
    try {
        let refresh = await refreshToken(credentials.refreshToken);
        credentials.apiKey = refresh.access_token;
        credentials.refreshToken = refresh.refresh_token;
        await credentials.save();
    } catch (e) {
        console.error("Failed to refresh Etsy token for shipment:", e.message);
    }
    const url = `https://openapi.etsy.com/v3/application/shops/${credentials.shopId}/receipts/${receiptId}/tracking`;
    const response = await axios.post(url, {
        tracking_code: trackingCode,
        carrier_name,
        send_bcc: false,
        send_notification: true,
    }, {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    }).catch(err => console.error("Etsy createReceiptShipment error:", err?.response?.data));
    return response?.data;
};
