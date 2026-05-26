import { TikTokAuth, Order, SkuToUpc, Products as Product, Color as Colors, Blank as Blanks, Item } from "@pythias/mongo";
import {
  getAuthorizedShops,
  getAccessTokenFromRefreshToken,
  uploadProductImage,
  uploadProductVideo,
  getRecommendedCategory,
  getWarehouses,
  getAttributes,
  createProduct,
  getOrdersTikTok,
  generatePieceID,
} from "@pythias/integrations";
const TOKEN_FIELDS = ["access_token", "access_token_expire_in", "refresh_token", "refresh_token_expire_in", "open_id", "granted_scopes", "seller_base_region", "user_type"];
const refresh = async (creds, cipher) => {
    let credentials = await TikTokAuth.findOne({ _id: creds._id });
    const tokens = await getAccessTokenFromRefreshToken(credentials.refresh_token);
    for (const key of TOKEN_FIELDS) {
        if (tokens[key] !== undefined) credentials[key] = tokens[key];
    }
    credentials.date = new Date(Date.now());
    credentials = await credentials.save();
    if (cipher) credentials.shop_cipher = cipher;
    return credentials;
}
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
export async function getShops(credentials){
    let shop = await getAuthorizedShops(credentials)
    if(shop.error && shop.msg == "refresh"){
        credentials = await refresh(credentials)
        shop = await getAuthorizedShops(credentials)
    }
    credentials.shop_list = shop.shop_list ?? []
    await credentials.save()
    return credentials.shop_list
}

export async function uploadTikTokImage({image, type, credentials}){
    let res = await uploadProductImage(image, credentials, type)
    if(res.error && res.error.msg == "refresh"){
        credentials = await refresh(credentials);
        res = await uploadProductImage(image, credentials, type)
    }
    return res
}
export async function createTikTokProduct({product, credentials, marketplaceName}){
    product = await Product.findOne({ _id: product._id }).populate("blanks design variantsArray.color variantsArray.threadColor");
    //console.log(credentials, "credentials")
    let tiktokProduct = {
        save_mode: "LISTING",
        description: product.description,
        title: product.title,
        is_cod_allowed: false,
        package_dimensions: {
            length: "13",
            height: "1",
            width: "10",
            unit: "INCH"
        },
        package_weight: {
            value: (product.sizes[0].weight / 16 > 0 ? product.sizes[0].weight / 16: 0.4 ).toFixed(2),
            unit: "POUND"
        },
        main_images: [],
        skus: [],
        category_version: "v2",
        idempotency_key: `${product.sku}`
    }
    // Step 1: category + warehouses in parallel
    let [categories, warehouses] = await Promise.all([
        getRecommendedCategory(product.title, credentials),
        getWarehouses(credentials),
    ]);
    if (categories.error && categories.msg === "refresh") {
        credentials = await refresh(credentials);
        [categories, warehouses] = await Promise.all([
            getRecommendedCategory(product.title, credentials),
            getWarehouses(credentials),
        ]);
    }
    tiktokProduct.category_id = categories.categories.filter(c => c.is_leaf)[0].id;
    const warehouse = warehouses.warehouses.filter(w => w.is_default)[0];

    // Step 2: attributes + all image uploads in parallel
    // Cache by URL so same-color variants don't re-upload the same image
    const uploadCache = new Map();
    const uploadCached = (url) => {
        const key = url.replace("=400", "=2400");
        if (!uploadCache.has(key)) {
            uploadCache.set(key, uploadTikTokImage({ image: key, type: "MAIN_IMAGE", credentials })
                .then(r => r.error ? null : { uri: r.uri }));
        }
        return uploadCache.get(key);
    };

    const uploadVariantImages = async (v) => {
        const [mainImage, ...extraImages] = await Promise.all([
            uploadCached(v.image),
            ...(v.images ?? []).map(im => uploadCached(im)),
        ]);
        return { mainImage, images: extraImages.filter(Boolean) };
    };

    let [attributes, variantImageResults, sizeChartRes, videoRes] = await Promise.all([
        getAttributes(tiktokProduct.category_id, credentials),
        Promise.all(product.variantsArray.map(uploadVariantImages)),
        product.blanks[0].sizeGuide?.images[0]
            ? uploadTikTokImage({ image: product.blanks[0].sizeGuide.images[0], type: "SIZE_CHART_IMAGE", credentials })
            : Promise.resolve(null),
        product.video
            ? uploadProductVideo(product.video, credentials)
            : Promise.resolve(null),
    ]);

    if (attributes.error && attributes.msg === "refresh") {
        credentials = await refresh(credentials);
        attributes = await getAttributes(tiktokProduct.category_id, credentials);
    }

    // Use variant main images for both main_images and sku_img (de-duped, capped at 9)
    const seenUris = new Set();
    tiktokProduct.main_images = variantImageResults
        .map(({ mainImage }) => mainImage)
        .filter(img => {
            if (!img?.uri || seenUris.has(img.uri)) return false;
            seenUris.add(img.uri);
            return true;
        })
        .slice(0, 9);

    if (sizeChartRes && !sizeChartRes.error) {
        tiktokProduct.size_chart = { image: { uri: sizeChartRes.uri } };
    }

    if (videoRes && !videoRes.error && videoRes.video_id) {
        tiktokProduct.video = { id: videoRes.video_id };
    }

    for (let i = 0; i < product.variantsArray.length; i++) {
        const v = product.variantsArray[i];
        const { mainImage, images: variantImages } = variantImageResults[i];
        const skuAttrs = [];
        skuAttrs.push({ name: "Color", value_name: v.color.name, sku_img: mainImage });
        skuAttrs.push({ name: "Size", value_name: product.sizes.filter(s => s._id.toLowerCase() === v.size.toLowerCase())[0].name });
        if (v.threadColor && v.threadColor.length > 0) {
            skuAttrs.push({ name: "Thread Color", value_name: v.threadColor.name });
        }
        const identifier_code = v.upc ? { code: v.upc, type: "UPC" } : undefined;
        tiktokProduct.skus.push({
            sales_attributes: skuAttrs,
            inventory: [{ warehouse_id: warehouse.id, quantity: 1000 }],
            seller_sku: v.sku,
            identifier_code,
            price: { amount: `${v.price ? v.price.toFixed(2) : v.size.retailPrice.toFixed(2)}`, currency: "USD" },
        });
    }
    let attrs = []
    if(product.season){
        attrs.push({
            id: attributes.attributes.filter(a=> a.name == "Season")[0].id,
            values: [{
                name: product.season
            }]
        })
    }
    attrs.push({
        id: attributes.attributes.filter(a=> a.name == "CA Prop 65: Carcinogens")[0].id,
        values: [{
            id: "1000059",
            name: "No"
        }]
    })
    attrs.push({
        id: attributes.attributes.filter(a=> a.name == "CA Prop 65: Repro. Chems")[0].id,
        values:[ {
            id: "1000059",
            name: "No"
        }]
    })
    const regionAttr = attributes.attributes.find(a => a.name === "Region Of Origin" || a.id === "100336");
    if (regionAttr) {
        attrs.push({ id: regionAttr.id, values: [{ name: "United States" }] });
    } else {
        attrs.push({ id: "100336", values: [{ name: "United States" }] });
    }
    const manufacturerAttr = attributes.attributes.find(a => a.name === "Manufacturer" || a.id === "100492");
    const brandName = product.brand?.name ?? product.blanks?.[0]?.brand?.name ?? "Pythias";
    if (manufacturerAttr) {
        attrs.push({ id: manufacturerAttr.id, values: [{ name: brandName }] });
    } else {
        attrs.push({ id: "100492", values: [{ name: brandName }] });
    }
    const cpsiaAttr = attributes.attributes.find(a => a.name === "CPSIA Tracking Label" || a.id === "101200");
    if (cpsiaAttr) {
        const yesValue = cpsiaAttr.values?.find(v => v.name?.toLowerCase() === "yes") ?? cpsiaAttr.values?.[0];
        if (yesValue) attrs.push({ id: cpsiaAttr.id, values: [{ id: yesValue.id, name: yesValue.name }] });
    }
    const ageAttr = attributes.attributes.find(a => a.name === "Recommended Age" || a.id === "100433");
    if (ageAttr) {
        const adultValue = ageAttr.values?.find(v => /adult|18|14/i.test(v.name)) ?? ageAttr.values?.[0];
        if (adultValue) attrs.push({ id: ageAttr.id, values: [{ id: adultValue.id, name: adultValue.name }] });
    } else {
        attrs.push({ id: "100433", values: [{ name: "Adult" }] });
    }
    // Attributes already handled explicitly — don't add twice
    const handledAttrs = new Set(attrs.map(a => a.id?.toString()));
    const tryAddAttr = (key, value) => {
        if (!key || !value) return;
        const at = attributes.attributes.find(a => a.name.toLowerCase() === key.toLowerCase());
        if (!at || handledAttrs.has(at.id?.toString())) return;
        handledAttrs.add(at.id.toString());
        const matchedValue = at.values?.find(v => v.name?.toLowerCase() === value.toLowerCase());
        attrs.push({ id: at.id, values: [matchedValue ? { id: matchedValue.id, name: matchedValue.name } : { name: value }] });
    };

    // blank.tikTokHeader and blank.marketPlaceOverrides["TikTok" / "tiktok"]
    for (const blank of product.blanks) {
        const sources = [blank.tikTokHeader, blank.marketPlaceOverrides?.["TikTok"], blank.marketPlaceOverrides?.["tiktok"]].filter(Boolean);
        for (const source of sources) {
            for (const key of Object.keys(source)) tryAddAttr(key, source[key]);
        }
    }

    // product.marketplaceValues — all marketplace entries, match by attribute name
    if (product.marketplaceValues) {
        for (const mpValues of Object.values(product.marketplaceValues)) {
            if (typeof mpValues !== "object") continue;
            for (const key of Object.keys(mpValues)) tryAddAttr(key, mpValues[key]);
        }
    }
    
    tiktokProduct.product_attributes = attrs
    let res = await createProduct({tiktokProduct, credentials})
    if(res.error && res.msg == "refresh"){
        credentials = await refresh(credentials);
        res = await createProduct({tiktokProduct, credentials})
    }
    console.log("createProduct res:", JSON.stringify(res))
    if(res.error || !res.product) throw new Error(`TikTok createProduct failed: ${res.msg ?? "no product returned"}`)
    const tiktokKey = marketplaceName ?? credentials.seller_name;
    const tiktokProductId = res.product.product_id;
    const $set = { [`ids.${tiktokKey}`]: tiktokProductId };
    for (let i = 0; i < product.variantsArray.length; i++) {
        const sku_id = res.product.skus?.find(s => s.seller_sku === product.variantsArray[i].sku)?.sku_id;
        if (sku_id) $set[`variantsArray.${i}.ids.${tiktokKey}`] = sku_id;
    }
    console.log("[TikTok] saving under key:", tiktokKey, "product._id:", product._id);
    await Product.findByIdAndUpdate(product._id, { $set });
    return { tiktokProductId };
}

export const getOrders = async (auths)=>{
    let orders = []
    for(let a of auths){
        for(let store of a.shop_list){
            let credentials = a
            //console.log(store.shop_cipher);
            credentials.shop_cipher = store.shop_cipher
            //console.log(credentials, "credentials");
            let res = await getOrdersTikTok({credentials});
            //console.log(res.error && res.msg == "refresh");
            if (res.error && res.msg == "refresh") {
                credentials = await refresh(credentials, store.shop_cipher);
                res = await getOrdersTikTok({ credentials});
            }
            console.log(!res.error, "res")
            if(!res.error) {
                let ords = [];
                for (let o of res.orders) {
                    o.tikTikShop = {
                        sellerName: credentials.seller_name,
                        sellerId: credentials._id,
                        shopId: store.shop_id,
                    };
                    console.log(o)
                    ords.push(o);
                }
                console.log(ords, "orders")
                orders = orders.concat(ords)
            }
        }
    }
    console.log(orders)
    return orders
}

export const processOrders = async (orders)=>{
    for(let o of orders){
        let order = await Order.findOne({poNumber: o.id})
        if (!order) {
            //console.log(o);
            //console.log(o.recipient_address)
            //console.log(o.recipient_address.district_info);
            order = new Order({
                orderId: `${o.create_time}_${o.id}`,
                poNumber: o.id,
                email: o.buyer_email,
                date: new Date(Date.now()),
                status: o.orderStatus,
                uniquePo: `${o.id}-${o.create_time}-tik_tok`,
                shippingAddress: {
                name: o.recipient_address.name,
                address1: o.recipient_address.address_line1,
                address2: o.recipient_address.address_line2,
                city: o.recipient_address.district_info.filter(
                    (d) => d.address_level_name == "City"
                )[0]
                    ? o.recipient_address.district_info.filter(
                        (d) => d.address_level_name == "City"
                    )[0].address_name
                    : "not provided",
                zip: o.recipient_address.postal_code,
                state: o.recipient_address.district_info.filter(
                    (d) => d.address_level_name == "State"
                )[0]
                    ? stateAbbreviations[
                        o.recipient_address.district_info.filter(
                        (d) => d.address_level_name == "State"
                        )[0].address_name
                    ]
                    ? stateAbbreviations[
                        o.recipient_address.district_info.filter(
                            (d) => d.address_level_name == "State"
                        )[0].address_name
                        ]
                    : o.recipient_address.district_info.filter(
                        (d) => d.address_level_name == "State"
                        )[0].address_name
                    : "not provided",
                country: o.recipient_address.region_code,
                },
                shippingType: o.delivery_option_name.replace("Shipping", "").trim(),
                marketplace: "tik tok",
                total: o.payment.total_amount,
                paid: true,
            });
            //console.log(order)
            //save order
            let items = [];
            for (let i of o.line_items) {
                console.log(i.seller_sku, i);
                let sku = await SkuToUpc.findOne({ sku: i.seller_sku });
                let design;
                let blank;
                let color;
                let size;
                if (sku) {
                    design = await Design.findOne({ _id: sku.design });
                    blank = await Blanks.findOne({ _id: sku.blank });
                    color = await Colors.findOne({ _id: sku.color });
                    size = blank?.sizes?.filter(
                    (s) =>
                        s.name.toLowerCase() ==
                        sku.size?.replace("Y", "").toLowerCase()
                    )[0];
                } else {
                    blank = await Blanks.findOne({
                    code: i.sku?.split("_")[0],
                    });
                    color = await Colors.findOne({
                    name: i.sku?.split("_")[1],
                    });
                    if (!color)
                    await Colors.findOne({ name: i.sku?.split("_")[2] });
                    if (blank) {
                    size = blank.sizes?.filter(
                        (s) =>
                        s.name.toLowerCase() ==
                        i.sku.split("_")[2]?.replace("Y", "").toLowerCase()
                    )[0];
                    if (!size)
                        size = blank.sizes?.filter(
                        (s) =>
                            s.name.toLowerCase() ==
                            i.sku.split("_")[1]?.replace("Y", "").toLowerCase()
                        )[0];
                    }
                    let dSku = i.sku?.split("_").splice(3);
                    let designSku = "";
                    if (dSku) {
                    for (let j = 0; j < dSku.length; j++) {
                        if (j == 0) designSku = dSku[j];
                        else designSku = `${designSku}_${dSku[j]}`;
                    }
                    design = await Design.findOne({ sku: designSku });
                    }
                }
                if (blank && blank.code.includes("PPSET")) {
                    let sb = await Blanks.findOne({
                    code: blank.code.split("_")[1],
                    });
                    let shirtItem = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.orderItemId,
                        blank: sb,
                        styleCode: sb?.code,
                        sizeName: size?.name,
                        colorName: color?.name,
                        color,
                        size,
                        design: design?.images,
                        designRef: design,
                        order: order._id,
                        shippingType: order.shippingType,
                        quantity: 1,
                        status: order.status,
                        name: i.name,
                        date: order.date,
                    });
                    let item = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.orderItemId,
                        blank,
                        styleCode: blank?.code,
                        sizeName: size?.name,
                        colorName: color?.name,
                        color,
                        size,
                        design: design?.images,
                        designRef: design,
                        order: order._id,
                        shippingType: order.shippingType,
                        quantity: 1,
                        status: order.status,
                        name: i.name,
                        date: order.date,
                    });
                    //console.log(item)
                // await item.save();
                    //await shirtItem.save();
                    items.push(item);
                    items.push(shirtItem);
                } else if (blank && blank.code == "LGDSET") {
                    let sb = await Blanks.findOne({ code: "LGDSWT" });
                    let shirtItem = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.orderItemId,
                        blank: sb,
                        styleCode: sb?.code,
                        sizeName: size?.name,
                        colorName: color?.name,
                        color,
                        size,
                        design: design?.images,
                        designRef: design,
                        order: order._id,
                        shippingType: order.shippingType,
                        quantity: 1,
                        status: order.status,
                        name: i.name,
                        date: order.date,
                    });
                    let item = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.orderItemId,
                        blank,
                        styleCode: blank?.code,
                        sizeName: size?.name,
                        colorName: color?.name,
                        color,
                        size,
                        design: design?.images,
                        designRef: design,
                        order: order._id,
                        shippingType: order.shippingType,
                        quantity: 1,
                        status: order.status,
                        name: i.name,
                        date: order.date,
                    });
                    //console.log(item)
                    //await item.save();
                    //await shirtItem.save();
                    items.push(item);
                    items.push(shirtItem);
                } else if (blank && blank.code == "LGDSET") {
                    let sb = await Blanks.findOne({ code: "GDT" });
                    let shirtItem = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.orderItemId,
                        blank: sb,
                        styleCode: sb?.code,
                        sizeName: size?.name,
                        colorName: color?.name,
                        color,
                        size,
                        design: design?.images,
                        designRef: design,
                        order: order._id,
                        shippingType: order.shippingType,
                        quantity: 1,
                        status: order.status,
                        name: i.name,
                        date: order.date,
                    });
                    let item = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.orderItemId,
                        blank,
                        styleCode: blank?.code,
                        sizeName: size?.name,
                        colorName: color?.name,
                        color,
                        size,
                        design: design?.images,
                        designRef: design,
                        order: order._id,
                        shippingType: order.shippingType,
                        quantity: 1,
                        status: order.status,
                        name: i.name,
                        date: order.date,
                    });
                    //console.log(item)
                    //await item.save();
                    // await shirtItem.save();
                    items.push(item);
                    items.push(shirtItem);
                } else {
                    let item = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.orderItemId,
                        blank,
                        styleCode: blank?.code,
                        sizeName: size?.name,
                        colorName: color?.name,
                        color,
                        size,
                        design: design?.images,
                        designRef: design,
                        order: order._id,
                        shippingType: order.shippingType,
                        quantity: 1,
                        status: order.status,
                        name: i.name,
                        date: order.date,
                    });
                    console.log(item)
                    //await item.save();
                    items.push(item);
                }
            }
            console.log(items)
            order.items = items;
        } else {
            order.status = o.orderStatus;
            if (order.status == "shipped") {
                order.items.map(async (i) => {
                i.status = order.status;
                i.labelPrinted = true;
                i = await i.save();
                });
            }
            if (order.status == "CANCELLED") {
              order.items.map(async (i) => {
                i.status = order.status;
                i.canceled = true;
                await i.save();
              });
            }
        }
        console.log(order)
    }
    return {error: false}
}