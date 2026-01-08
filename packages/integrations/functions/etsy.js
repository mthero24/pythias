const etsyKeyString="480pxuspxi5wz93puk47snye"
const etsySharedSecret="16xlth05x7"
import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";
import { get } from "http";
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
    console.log(`Full URL: https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3009/oauth/redirect&scope=transactions_r%20email_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=480pxuspxi5wz93puk47snye&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`)
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3009/api/admin/integrations/etsy/oauth/redirect&scope=email_r%20transactions_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=480pxuspxi5wz93puk47snye&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
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
        v.size = product.sizes.find(s => s._id.toString() === v.size.toString());
        v.blank = product.blanks.find(b => b._id.toString() === v.blank.toString());
        v.color = product.colors.find(c => c._id.toString() === v.color.toString());
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
        let size_name = variant.size.name;
        size_name = variant.size.name.replace("SM", "S");
        size_name = variant.size.name.replace("LG", "L");
        size_name = variant.size.name.replace("MD", "M");
        size_name = variant.size.name.toLowerCase().replace("2xl", "xxl");
        size_name = variant.size.name.toLowerCase().replace("5t", "5").replace("5/6T", "5");
        let size, color, secondarySize;
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
                name: toTitleCase(variant.color.name),
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
            
            let url = variant.image
            //console.log(url, "url");
            if (!url) continue;
            if (!colorImageCompleted.includes(url) && i < 20) {
                i++;
                try {
                    // Get image buffer using axios
                    const response = await axios.get(url.replace("400", "800"), {
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
                // if(variant.images && variant.images.length > 0){
                //     if (!colorImageCompleted.includes(url) && i < 20) {
                //         i++;
                //         try {
                //             // Get image buffer using axios
                //             const response = await axios.get(url, {
                //                 responseType: "arraybuffer",
                //                 timeout: 30000, // 30 second timeout
                //             });
                //             //console.log("Image fetched successfully", response.data, color.name);
                //             let blob = await b64toBlob(response.data.toString('base64'), 'image/jpeg');
                //             console.log("++++++++++++ ", i, "+++++++++++++++++++++")
                //             // Create form data with the image buffer
                //             let formData = new FormData();
                //             formData.append("listing_id", listing_id);
                //             formData.append("rank", i);
                //             formData.append("alt_text", `${color.name}`);
                //             formData.append("image", Buffer.from(await blob.arrayBuffer()), {
                //                 filename: "etsy.jpg",
                //             });

                //             // Add retry logic for the upload
                //             let retries = 3;
                //             while (retries > 0) {
                //                 retries--;
                //                 try {
                //                     await new Promise((resolve) => setTimeout(resolve, 500));
                //                     let image = await uploadListingImage(
                //                         credentials,
                //                         listing_id,
                //                         formData,
                //                     )
                //                     colorImageCompleted.push(url);
                //                     break;
                //                 } catch (e) {
                //                     console.log(e)
                //                     console.log(`Retrying image upload (${3 - retries}/3)`);
                //                     if (retries === 0) {
                //                         console.error(
                //                             `Failed to upload image after 3 attempts: ${e.message}`,
                //                             color.name
                //                         );
                //                     }
                //                 }
                //                 await new Promise((resolve) => setTimeout(resolve, 1000));
                //             }
                //         } catch (e) {
                //             colorImageCompleted.push(url);
                //             console.error(`Failed to process image: ${e.message}`, color.name);
                //         }
                //     }
                // }
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
    let response = await axios.put(url, updateInventory, requestOptions);
    //console.log(response.data, "response data+++++++");
    return response.data;
};

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
const styleToTaxonomyId = {
    // T-Shirts
    AT: 11136, // Men's T-Shirts
    PT: 11136, // Men's Premium T-Shirts
    ATT: 11136, // Men's Tall T-Shirts
    WT: 11170, // Women's T-Shirts
    WVT: 11170, // Women's V-Neck T-Shirts
    PS: 11170, // Women's Plus Size T-Shirts
    PSV: 11170, // Women's Plus Size V-Neck T-Shirts
    YT: 11170, // Kids' T-Shirts
    TT: 11170, // Toddler T-Shirts
    YTDS: 11170, // Kids' Tie-Dye T-Shirts
    TDS: 11136, // Men's Tie-Dye T-Shirts
    AV: 11136, // Men's V-Neck T-Shirts
    WSC: 11170, // Women's Scoop Neck T-Shirts
    WCT: 11170, // Women's Crop Top Tees
    WTS: 11170, // Women's Tri-Blend 3/4-Sleeve Raglan Shirts
    YBS: 11170, // Kids' Colorblock Raglan Jersey
    TJB: 11170, // Toddler Fine Jersey T-Shirts
    LST6041: 11170, // Ladies Halftime Notch Neck Tee
    EZ012: 11170, // Enza Ladies Mélange V-Neck Tee Shirt
    EZ145: 11170, // Enza Ladies Jersey Football T-Shirt
    EZ038: 11170, // Enza Ladies Essential V-Neck Tee
    EZ146: 11170, // Enza Ladies Jersey Colorblock Tee
    WEBT: 11170, // Women's Boxy T-Shirts
    A4282: 11136, // Men's Cooling Performance Crew T-Shirts
    N3402: 11136, // Men's Performance Sprint T-Shirts
    NB3402: 11170, // Kids' Performance Sprint T-Shirts
    CE111: 11136, // Men's Adult ChromaSoft Performance T-Shirts
    CE111T: 11136, // Men's Tall Fusion ChromaSoft Performance T-Shirts
    NB3142: 11170, // Kids' Cooling Performance T-Shirts
    TT11: 11136, // Men's Team 365 Zone Performance T-Shirts
    TT11Y: 11170, // Kids' Team 365 Zone Performance T-Shirts
    A230: 11136, // Men's Performance Polo
    A324: 11136, // Men's 3-Stripes Chest Polo
    A574: 11136, // Men's Pine Tree Polo
    K569: 11136, // Men's Diamond Jacquard Polo
    K572: 11136, // Men's Dry Zone Grid Polo
    ST640: 11136, // Men's PosiCharge RacerMesh Polo
    K540LS: 11136, // Men's Silk Touch Performance Long Sleeve Polo
    GD64800: 11136, // Men's Softstyle Adult Sport Polo
    A595: 11136, // Men's Button Down Short Sleeve Shirt
    L535: 11136, // Men's Industrial Long Sleeve Work Shirt
    SY42: 11136, // Men's Performance Plus Short Sleeve Shirt
    BSM16: 11136, // Men's Heavyweight Short Sleeve Pocket Tee
    BSM23: 11136, // Men's Heavyweight Long Sleeve Pocket Tee
    JTA001: 11136, // Men's AWDIS T-Shirt
    N2359: 11136, // Men's Performance Sport Tank
    ST356: 11136, // Men's PosiCharge Competitor Tank
    LST402: 11170, // Women's PosiCharge Tri-Blend Wicking Tank
    LST356: 11170, // Women's PosiCharge Competitor Racerback Tank
    LST352: 11170, // Women's Sleeveless PosiCharge Competitor V-Neck Tank
    LST410: 11170, // Women's PosiCharge Tri-Blend Wicking Draft Hoodie Tank
    UA012: 11170, // Women's Knotted Racerback Tank
    UA010: 11170, // Women's Strappy Tank
    EZ049: 11170, // Women's Essential Flowy Tank
    WRT: 11170, // Women's Perfect Tri Rocker Tank
    RCT: 11170, // Women's Racerback Cropped Tank
    ELT: 11170, // Women's Essential Tank
    RBT: 11170, // Women's Racerback Tank
    TK: 11136, // Men's Tank Top
    MBJT: 11136, // Men's Mesh Reversible Basketball Jersey Tank
    AG239: 11136, // Men's Raglan 3/4 Sleeve Baseball Jersey
    ST376: 11136, // Men's Drift Camo Colorblock T-Shirt
    DT110: 11170, // Women's CVC Long Sleeve Shirt
    3911: 11170, // Women's Cotton Relaxed Long Sleeve T-Shirt
    DTL: 11170, // Women's Perfect Tri Tunic Long Sleeve Shirt
    WLT: 11170, // Women's Long Sleeve Shirt
    AL: 11136, // Men's Long Sleeve Shirt
    TDLS: 11136, // Men's Tie-Dye Long Sleeve Shirt
    RBS: 11136, // Men's Baseball Sleeve Shirt
    YLT: 11170, // Kids' Long Sleeve Shirt
    TLT: 11170, // Toddler Long Sleeve Shirt
    LST: 11136, // Men's Tall Long Sleeve T-Shirt
    N3165: 11136, // Men's Cooling Performance Long Sleeve Crew
    TT11L: 11136, // Men's Zone Performance Long-Sleeve T-Shirt
    67000: 11136, // Men's Softstyle CVC T-Shirt
    67400: 11136, // Men's Softstyle CVC Long Sleeve T-Shirt
    200: 11136, // Men's SoftShirts Classic T-Shirt
    220: 11136, // Men's SoftShirts Classic Long Sleeve T-Shirt
    980: 11136, // Men's SoftStyle Lightweight T-Shirt
    42000: 11136, // Men's Performance T-Shirt
    8000: 11136, // Men's DryBlend Adult T-Shirt
    8400: 11136, // Men's DryBlend 50/50 Long Sleeve T-Shirt
    1717: 449, // Men's Garment-Dyed Heavyweight T-Shirt
    "307GD": 11170, // Women's Garment-Dyed Muscle Tee
    5389: 11136, // Men's Sueded Cloud Jersey T-Shirt
    2300: 11136, // Men's Ultra Cotton Pocket T-Shirt
    "3023CL": 11170, // Women's Comfort Colors Boxy T-Shirt

    // Sweatshirts
    AS: 2201, // Men's Sweatshirt
    PTCS: 2201, // Men's Tall Sweatshirt
    YAS: 2203, // Kids' Sweatshirt
    TAS: 2203, // Toddler Sweatshirt
    EZ962: 2203, // Enza Youth Fleece Crew
    1545: 2201, // Men's Colorblast Crewneck Sweatshirt
    PRM2000: 2200, // Women's California Wash Sweatshirt
    WLCCP: 2200, // Women's Cropped Pullover Crew
    LS14004: 2201, // Men's Premium Crewneck Sweatshirt
    LSSET001: 2201, // Men's Premium Hooded Sweatsuit Set
    LSSET002: 2201, // Men's Premium Crewneck Sweatsuit Set
    1566: 2201, // Men's Garment-Dyed Sweatshirt
    12500: 2201, // Men's DryBlend Hooded Sweatshirt

    // Hoodies
    AFTH: 1852, // Men's Hoodie
    THPC: 1852, // Men's Tall Hoodie
    YHD: 1854, // Kids' Hoodie
    THD: 1854, // Toddler Hoodie
    TDHD: 1852, // Men's Tie Dye Hoodie
    JH354: 1852, // Men's Unisex Surf Hoodie
    BLCTH: 1851, // Women's Crop Top Hoodie
    DTWRFH: 1851, // Women's Fleece Hoodie
    LPCPH: 1851, // Women's Pullover Hoodie
    EZ329: 1851, // Women's Funnel Neck Pullover Hood
    ZUHD: 1852, // Men's Full Zip Hoodie
    LS12000: 1851, // Women's Crop Fleece Hoodie
    LS14001: 1852, // Men's Premium Pullover Hoodie
    LS16001: 1852, // Men's Urban Pullover Hoodie
    CHP180: 1852, // Men's Sport Hooded Sweatshirt
    305: 1852, // Men's Performance Fleece Hoodie
    IND5000P: 1852, // Men's Premium Hoodie
    1467: 1852, // Men's Garment-Dyed Fleece Hoodie
    "996MR": 1852, // Men's NuBlend Hooded Sweatshirt
    8110: 1774, // visor
};
