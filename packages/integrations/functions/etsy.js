const etsyKeyString="480pxuspxi5wz93puk47snye"
const etsySharedSecret="16xlth05x7"
import crypto from "crypto";
import axios from "axios";
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
    const requestOptions = {
        headers: {
            "x-api-key": etsyKeyString,
        },
    };
    let url = `https://api.etsy.com/v3/public/oauth/token`;
    let response = await axios.post(
        url,
        {
            grant_type: "refresh_token",
            client_id: etsyKeyString,
            refresh_token: refreshToken,
        },
        requestOptions
    );

    console.log(response.data);
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
    console.log(`Full URL: https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3003/oauth/redirect&scope=transactions_r%20email_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=480pxuspxi5wz93puk47snye&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`)
    return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=http://localhost:3008/api/admin/integrations/etsy/oauth/redirect&scope=email_r%20transactions_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w&client_id=480pxuspxi5wz93puk47snye&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    //transactions_r%20email_r%20transactions_w%20listings_r%20listings_w%20listings_d%20shops_r%20shops_w
};
const base64URLEncode = (str) =>
    str
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

export const uploadListingImage = async (
    shop_id,
    listing_id,
    formData,
    access_token
) => {
    const requestOptions = {
        headers: {
            "x-api-key": ETSY_KEYSTRING,
            Authorization: `Bearer ${access_token}`,
            ...formData.getHeaders(),
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops/${shop_id}/listings/${listing_id}/images`;
    let response = await api.post(url, formData, requestOptions);
    return response;
};


// etsyAPI.createDraftListing = async (product, variants, credentials) => {
//     let access_token = credentials.accessToken;
//     const requestOptions = {
//         headers: {
//             "x-api-key": ETSY_KEYSTRING,
//             Authorization: `Bearer ${access_token}`,
//         },
//     };
//     const user_id = access_token.split(".")[0];
//     let shop = await etsyAPI.getShopByOwnerUserId(user_id, access_token);
//     console.log(shop, "shop");
//     let shippingProfiles = await etsyAPI.getShopShippingProfiles(
//         shop.shop_id,
//         access_token
//     );

//     // //setup here to pull in all draft listigns
//     // let listings = await etsyAPI.getShopListings(shop.shop_id, access_token);
//     // console.log(JSON.stringify(listings, null, 2), "listings");
//     // let sku = listings.results[0].skus[0];
//     // //can we check the entier variant???

//     // // Get the full inventory details for the first listing
//     // let firstListingId = listings.results[0].listing_id;
//     // let inventory = await etsyAPI.getListingInventory(
//     //   firstListingId,
//     //   access_token
//     // );
//     // console.log("FULL INVENTORY DETAILS:");
//     // console.log(JSON.stringify(inventory, null, 2));

//     // return;
//     let shipping_profile_id;
//     if (
//         shippingProfiles.results.filter((p) => p.title == "Print Oracle").length ==
//         0
//     ) {
//         let shippingProfile = await etsyAPI.createShopShippingProfile(
//             shop.shop_id,
//             access_token
//         );
//         shipping_profile_id = shippingProfile.shipping_profile_id;
//     } else {
//         shipping_profile_id = shippingProfiles.results.filter(
//             (p) => p.title == "Print Oracle"
//         )[0].shipping_profile_id;
//     }

//     let returnPolicyId;
//     try {
//         let returnPolicies = await etsyAPI.getShopReturnPolicies(
//             shop.shop_id,
//             credentials
//         );
//         console.log(returnPolicies);

//         returnPolicyId = returnPolicies?.results?.[0]?.return_policy_id;
//     } catch (e) {
//         console.log(e);
//     }

//     console.log(returnPolicyId, "returnPolicyId");

//     let listing = {
//         quantity: 999,
//         title: product.name,
//         shipping_profile_id: shipping_profile_id,
//         description: product.description,
//         price: product.price,
//         who_made: "someone_else",
//         when_made: "made_to_order",
//         taxonomy_id: styleToTaxonomyId[product.style.code] ?? 11136,
//         return_policy_id: returnPolicyId,
//         processing_min: 1,
//         processing_max: 3,
//         tags: [
//             ...new Set(
//                 product.tags
//                     .filter(
//                         (tag) =>
//                             tag.length > 0 && tag.length < 20 && !tag.match(/[^a-zA-Z0-9 ]/gi)
//                     )
//                     .slice(0, 12)
//             ),
//         ],
//         is_supply: true,
//         type: "physical",
//         // taxonomy_id: 374 /* 2830?? */,
//     };
//     console.log(listing);
//     let url = `https://openapi.etsy.com/v3/application/shops/${shop.shop_id}/listings`;
//     let response = await api.post(url, listing, requestOptions);

//     console.log(response.data);

//     let getInventory = await etsyAPI.getListingInventory(
//         response.data.listing_id,
//         access_token
//     );

//     await etsyAPI.updateListing(
//         shop.shop_id,
//         response.data.listing_id,
//         variants,
//         getInventory.products[0].product_id,
//         access_token
//     );

//     return response.data;
// };
