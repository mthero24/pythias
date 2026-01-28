const etsyKeyString="480pxuspxi5wz93puk47snye"
const etsySharedSecret="16xlth05x7"
import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";
import {Order, Products, Item, Inventory, ProductInventory} from "@pythias/mongo"

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
    console.log("refreshing token+++++++", refreshToken);
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

    console.log(`State: ${state}`);
    console.log(`Code challenge: ${codeChallenge}`);
    console.log(`Code verifier: ${codeVerifier}`);
    console.log(`Full URL: https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3006/api/admin/integrations/etsy/oauth/redirect&scope=transactions_r%20email_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=480pxuspxi5wz93puk47snye&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`)
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3006/api/admin/integrations/etsy/oauth/redirect&scope=email_r%20transactions_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=480pxuspxi5wz93puk47snye&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
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
        console.log(err.response.data)
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
                    console.log(err.response.data)
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
    console.log(response.data);
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
        console.log(err.response.data)
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
        console.log(err.response.data)
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
        console.log(err.response.data)
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
                    console.log(err.response.data)
                    errData = err.response.data;
                });
            }
        }
    }
    return {listing: response.data, updatedCredentials: credentials};
}
const createListing = async (product, returnPolicyId, shipping_profile_id, credentials) => {
    let {readinessStates, updatedCredentials} = await getRedinessStates(credentials);
    console.log(readinessStates, "readinessStates+++++++");
    credentials = updatedCredentials;
    if (readinessStates.count == 0) {
        let {response, updatedCredentials2} = await createRedinessState(credentials);
        credentials = updatedCredentials2;
        console.log(response, "response+++++++");
        let { readinessStates2, updatedCredentials } = await getRedinessStates(credentials);
        readinessStates = readinessStates2;
        credentials = updatedCredentials;
    }
    let taxonomy_id = 449; // default to mens tshirts
    console.log(product.gender, product.blanks[0].department, product.blanks[0].category, "+++++++++++++");
    if (product.gender === "Male" && product.blanks[0].department == "Adult"){
        if(product.blanks[0].category == "T-Shirts")taxonomy_id = taxonomyIds.mensTshirts;
        if(product.blanks[0].category == "Tank Tops")taxonomy_id = taxonomyIds.mensTanks;
        if(product.blanks[0].category == "Long Sleeve Shirts")taxonomy_id = taxonomyIds.mensLongSleeveShirts;
        if(product.blanks[0].category == "Hoodies")taxonomy_id = taxonomyIds.mensHoodies;
        if(product.blanks[0].category == "Sweatshirts")taxonomy_id = taxonomyIds.mensSweatshirts;
    }else if(product.gender === "Female" && product.blanks[0].department == "Adult"){
        if(product.blanks[0].category == "T-Shirts")taxonomy_id = taxonomyIds.womensTshirts;
        if(product.blanks[0].category == "Tank Tops")taxonomy_id = taxonomyIds.womensTanks;
        if(product.blanks[0].category == "Long Sleeve Shirts")taxonomy_id = taxonomyIds.womensLongSleeveShirts;
        if(product.blanks[0].category == "Hoodies")taxonomy_id = taxonomyIds.womensHoodies;
        if(product.blanks[0].category == "Sweatshirts")taxonomy_id = taxonomyIds.womensSweatshirts;
    } else if (product.gender === "Unisex" && product.blanks[0].department == "Adult"){
        if(product.blanks[0].category == "T-Shirts")taxonomy_id = taxonomyIds.unisexTshirts;
        if(product.blanks[0].category == "Tank Tops")taxonomy_id = taxonomyIds.unisexTanks;
        if(product.blanks[0].category == "Long Sleeve Shirts")taxonomy_id = taxonomyIds.unisexLongSleeveShirts;
        if(product.blanks[0].category == "Hoodies")taxonomy_id = taxonomyIds.unisexHoodies;
        if(product.blanks[0].category == "Sweatshirts")taxonomy_id = taxonomyIds.unisexSweatshirts;
    }else if(product.gender == "Male" && product.blanks[0].department == "Kids"){
        if(product.blanks[0].category == "T-Shirts")taxonomy_id = taxonomyIds.boysTshirts;
        if(product.blanks[0].category == "Tank Tops")taxonomy_id = taxonomyIds.boysTanks;
        if(product.blanks[0].category == "Long Sleeve Shirts")taxonomy_id = taxonomyIds.boysLongSleeveShirts;
        if(product.blanks[0].category == "Hoodies")taxonomy_id = taxonomyIds.boysHoodies;
        if(product.blanks[0].category == "Sweatshirts")taxonomy_id = taxonomyIds.boysSweatshirts;
        if(product.blanks[0].category == "Bodysuits")taxonomy_id = taxonomyIds.boysBodiesuits;
    }else if(product.gender == "Female" && product.blanks[0].department == "Kids"){
        if(product.blanks[0].category == "T-Shirts")taxonomy_id = taxonomyIds.girlsTshirts;
        if(product.blanks[0].category == "Tank Tops")taxonomy_id = taxonomyIds.girlsTanks;
        if(product.blanks[0].category == "Long Sleeve Shirts")taxonomy_id = taxonomyIds.girlsLongSleeveShirts;
        if(product.blanks[0].category == "Hoodies")taxonomy_id = taxonomyIds.girlsHoodies;
        if(product.blanks[0].category == "Sweatshirts")taxonomy_id = taxonomyIds.girlsSweatshirts;
        if(product.blanks[0].category == "Bodysuits")taxonomy_id = taxonomyIds.girlsBodiesuits;
    }else if(product.gender == "Unisex" && product.blanks[0].department == "Kids"){ 
        if(product.blanks[0].category == "T-Shirts")taxonomy_id = taxonomyIds.unisexKidsTshirts;
        if(product.blanks[0].category == "Tank Tops")taxonomy_id = taxonomyIds.unisexKidsTanks;
        if(product.blanks[0].category == "Long Sleeve Shirts")taxonomy_id = taxonomyIds.unisexKidsLongSleeveShirts;
        if(product.blanks[0].category == "Hoodies")taxonomy_id = taxonomyIds.unisexKidsHoodies;
        if(product.blanks[0].category == "Sweatshirts")taxonomy_id = taxonomyIds.unisexKidsSweatshirts;
        if(product.blanks[0].category == "Bodysuits")taxonomy_id = taxonomyIds.unisexKidsBodiesuits;
    }
    let listing = {
        quantity: 999,
        title: product.title,
        shipping_profile_id: shipping_profile_id,
        description: product.description,
        sku: product.sku || "N/A",
        price: product.sizes[0].retailPrice.toFixed(2),
        who_made: "someone_else",
        when_made: "made_to_order",
        taxonomy_id: taxonomy_id,
        return_policy_id: returnPolicyId,
        processing_min: 1,
        processing_max: 3,
        materials: product.materials || ["cotton"],
        item_weight: product.sizes[0].weight || 0.2,
        item_weight_unit: "oz",
        item_length: 13,
        item_width: 9,
        item_height: 0.5,
        item_dimensions_unit: "in",
        should_auto_renew: true,
        is_taxable: true,
        tags: [
            ...new Set(
                product.tags
                    .filter(
                        (tag) =>
                            tag && tag?.length > 0 && tag?.length < 20 && !tag?.match(/[^a-zA-Z0-9 ]/gi)
                    )
                    .slice(0, 12)
            ),
        ],
        is_supply: true,
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
        console.log(err.response.data)
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
        console.log(err.response.data)
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
    console.log(response.data, response.data.products, "response data+++++++");
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
    console.log(readinessStates, "readinessStates+++++++");
    credentials = updatedCredentials;
    if (readinessStates.count == 0) {
        let { response, updatedCredentials2 } = await createRedinessState(credentials);
        credentials = updatedCredentials2;
        console.log(response, "response+++++++");
        let { readinessStates2, updatedCredentials } = await getRedinessStates(credentials);
        readinessStates = readinessStates2;
        credentials = updatedCredentials;
    }
    console.log("updateListing()", variants.length);
    const requestOptions = {
        headers: {
            "x-api-key": `${process.env.etsyApiKey}`,
            Authorization: `Bearer ${credentials.apiKey}`,
        },
    };
    let url = `https://openapi.etsy.com/v3/application/listings/${listing_id}/inventory?legacy=false`;
    let i = 0;
    let inventory = [];
    let colorImageCompleted = [];
    let hasSeconarySize = variants[0]?.secondarySize ? true : false;
    
    for (let variant of variants) {
        if (variant.sku.length > 32) {
            console.log("sku to long error", variant.sku, variant.sku.length);
            continue;
        }
        console.log(variant.size, variant.color, "variant+++++++");
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

        if (size && color) {
            
            let url = variant.image?.replace("400", "1200");
            //console.log(url, "url");
            if (!url) continue;
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
                    console.log( "++++++++++++ ", i, "+++++++++++++++++++++" )
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
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                } catch (e) {
                    colorImageCompleted.push(url);
                    console.error(`Failed to process image: ${e.message}`, color.name);
                }
                if(variant.images && variant.images.length > 0){
                    console.log("here+++++++", variant.images.length);
                    for(let url of variant.images){
                        url = url.replace("400", "1200");
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
    if (variants[0].blank.sizeGuide.images[0]) {
        i++;
        try {
            // Get image buffer using axios
            let url = variants[0].blank.sizeGuide.images[0];
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
    console.log(getInventory, "getInventory+++++++");
    updateListing(
        credentials,
        listing_id,
        product,
        getInventory.products[0].product_id,
    );
}
export const createDraftListing = async (product, credentials) => {
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
            credentials
        );
        let listing = response.listing;
        credentials = response.updatedCredentials;
        console.log(listing, "listing created+++++++");
        let {getInventory, updatedCredentials2} = await getListingInventory(
            listing.listing_id,
            credentials
        );
        credentials = updatedCredentials2;
        console.log(getInventory, "getInventory+++++++");
        updateListing(
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
    console.log(response.data.results.filter(r => r.name.toLowerCase().includes("clothing"))[0], "taxonomy ids+++++++++");
    let clothing = response.data.results.filter(r => r.name.toLowerCase().includes("clothing"))[0];
    let children = clothing.children;
    let mens = children.filter(c => c.name.toLowerCase().includes("women's clothing"))[0];
    console.log(mens, "mens+++++++++");
    let womens = children.filter(c => c.name.toLowerCase().includes("women's clothing"))[0];
    console.log(womens, "womens+++++++++");

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
        pieceId: 123245,
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
            console.log(inventory.attached, "inventory to save")
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
        console.log(refresh);
        await credentials.save();
        let receipts = await getShopReceipts(
            credentials
        );
        console.log(receipts.results)
    for (let etsy_order of receipts.results) {
        try {
          if (etsy_order.status == "Canceled") {
            continue;
          }
          let order = await Order.findOne({poNumber: etsy_order["receipt_id"]})
          if (order) {
            console.log("updating etsy shipping shipping_Info");
            console.log(etsy_order["name"]);
            let trackingDetails = getOrderTrackingDetails(order);
            if (order && trackingDetails?.trackingNumber) {
              await etsyAPI.createReceiptShipment(
                shop.shop_id,
                etsy_order.receipt_id,
                trackingDetails,
                credentials.accessToken
              );
            }
          } else {
            console.log("creating etsy order");
            console.log(etsy_order.transactions)
            let items = []
            let order = await new Order({poNumber: etsy_order.receipt_id, shippingAddress: {
                    name: etsy_order["name"],
                    address1: etsy_order["first_line"]? etsy_order["first_line"]: "not provided",
                    address2: etsy_order["second_line"],
                    city: etsy_order["city"]? etsy_order["city"]: "not provided",
                    zip: etsy_order["zip"]?  etsy_order["zip"]: "not provided",
                    state: etsy_order["state"]? etsy_order["state"]: "not provided",
                    country: etsy_order["country_iso"]? etsy_order["country_iso"]: "not provided"
                }, status: "Paid", marketplace: "etsy", shippingType: "Standard", orderId: etsy_order.receipt_id})
            for(let trans of etsy_order.transactions ){
                let itms = await buildMarketplaceFulfillmentItems(trans.sku, trans.quantity, order)
                items = [...items, ...itms]
            }
            order.items = items
            console.log(items.length, "items")
            await order.save()
          }
        } catch (err) {
          console.log(err);
        }
      }
    } catch (err) {
       console.log(err);
    }

//   console.log("complete");
};
