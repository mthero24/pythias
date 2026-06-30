import { TikTokAuth, PlatformDesign as Design, PlatformOrder as Order, SkuToUpc, PlatformColor as Colors, PlatformBlank as Blanks, PlatformItem as Item, PlatformProduct as Products } from "@pythias/mongo";
import {
  getAuthorizedShops,
  getAccessTokenFromRefreshToken,
  uploadProductImage,
  getRecommendedCategory,
  getWarehouses,
  getAttributes,
  createProduct,
  getOrdersTikTok,
  generatePieceID,
  getOrCreateBrandTikTok,
  getShippingProvidersTikTok,
  getOrderDetailTikTok,
  createPackageTikTok,
  shipPackageTikTok,
} from "@pythias/integrations";
import { maybeDropshipOrder } from "@pythias/backend/server";
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

// Map a free-form carrier/provider string to the matching TikTok shipping provider id.
// TikTok provider names look like "USPS", "UPS", "FedEx", "DHL eCommerce", etc.
const matchTikTokProvider = (providers, provider) => {
    if (!providers?.length) return null;
    const p = (provider || "").toLowerCase();
    const carrier =
        p.includes("ups") && !p.includes("usps") ? "ups" :
        p.includes("fedex") ? "fedex" :
        p.includes("dhl") ? "dhl" :
        p.includes("usps") || p.includes("postal") ? "usps" : p;
    const exact = providers.find(o => (o.name || "").toLowerCase() === p);
    if (exact) return exact.id;
    const loose = providers.find(o => {
        const n = (o.name || "").toLowerCase();
        return carrier && (n.includes(carrier) || carrier.includes(n));
    });
    return (loose || providers[0])?.id ?? null;
};

/**
 * Push a shipment/tracking back to TikTok for a directly-pulled TikTok order (created by
 * pullTikTokOrders — poNumber === the TikTok order id, marketplace "tik tok"). Multi-tenant:
 * scopes credentials to the order's orgId. Mirrors premier's shipOrderTikTok.
 * @returns {{error:boolean, msg?:string}}
 */
export async function shipOrderTikTok({ order, items, trackingNumber, provider }) {
    if (!trackingNumber) return { error: true, msg: "No tracking number" };

    let credentials = await TikTokAuth.findOne(order.orgId ? { orgId: order.orgId } : { provider: "premierPrinting" });
    if (!credentials) return { error: true, msg: "No TikTok credentials found" };

    if (!credentials.shop_list?.length) {
        let shop = await getAuthorizedShops(credentials);
        if (shop?.error && shop?.msg === "refresh") {
            credentials = await refresh(credentials);
            shop = await getAuthorizedShops(credentials);
        }
        if (shop?.shop_list?.length) {
            credentials.shop_list = shop.shop_list;
            await credentials.save();
        }
    }
    const shopCipher = credentials.shop_list?.[0]?.shop_cipher;
    if (!shopCipher) return { error: true, msg: "No TikTok shop cipher available" };

    // Shipping providers are scoped to the order's delivery option, so fetch the order detail first.
    let detail = await getOrderDetailTikTok(order.poNumber, credentials, shopCipher);
    if (detail?.error && detail?.msg === "refresh") {
        credentials = await refresh(credentials, shopCipher);
        detail = await getOrderDetailTikTok(order.poNumber, credentials, shopCipher);
    }
    if (detail?.error) return { error: true, msg: `Could not load TikTok order detail (${detail.msg})` };
    const tikTokOrder = detail.orders?.[0];
    const deliveryOptionId = tikTokOrder?.delivery_option_id;
    if (!deliveryOptionId) return { error: true, msg: "No TikTok delivery_option_id on order" };

    let provRes = await getShippingProvidersTikTok(credentials, shopCipher, deliveryOptionId);
    if (provRes?.error && provRes?.msg === "refresh") {
        credentials = await refresh(credentials, shopCipher);
        provRes = await getShippingProvidersTikTok(credentials, shopCipher, deliveryOptionId);
    }
    if (provRes?.error) return { error: true, msg: `Could not load TikTok shipping providers (${provRes.msg})` };
    const shippingProviderId = matchTikTokProvider(provRes.providers, provider);
    if (!shippingProviderId) return { error: true, msg: "No matching TikTok shipping provider" };

    const line_item_ids = (tikTokOrder?.line_items?.length
        ? tikTokOrder.line_items.map(li => li.id)
        : (items || []).map(i => i.orderItemId))
        .filter(Boolean);

    // TikTok 202309 is two-step: get/create the package, then ship it. TikTok usually auto-creates
    // one package per order, so prefer the existing package id; create one only if it's missing.
    let packageId = tikTokOrder?.packages?.[0]?.id || tikTokOrder?.package_list?.[0]?.id || null;
    const shipOnce = async () => {
        if (!packageId) {
            const created = await createPackageTikTok(order.poNumber, line_item_ids, credentials, shopCipher);
            if (created?.error) return created;
            packageId = created.package_id;
        }
        if (!packageId) return { error: true, msg: "No TikTok package id available to ship" };
        return shipPackageTikTok(packageId, { tracking_number: trackingNumber, shipping_provider_id: shippingProviderId }, credentials, shopCipher);
    };

    let res = await shipOnce();
    if (res?.error && res?.msg === "refresh") {
        credentials = await refresh(credentials, shopCipher);
        res = await shipOnce();
    }
    if (res?.error) return { error: true, msg: res.msg };
    return { error: false };
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
export async function getShops(){
    let credentials = await TikTokAuth.findOne({provider: "premierPrinting"})
    let shop = await getAuthorizedShops(credentials)
    if(shop.error && shop.msg == "refresh"){
        credentials = await refresh(credentials)
        shop = await getAuthorizedShops(credentials)
    } 
    credentials.shop_list = shop.shop_list
    await credentials.save()
}

export async function uploadTikTokImage({image,type}){
    let credentials = await TikTokAuth.findOne({provider: "premierPrinting"})
    let res = await uploadProductImage(image, credentials, type)
    if(res.error && res.error.msg == "refresh"){
        credentials = await refresh(credentials);
        res = await uploadProductImage(image, credentials, type)
    }
    return res
}
export async function createTikTokProduct({product}){
    let credentials = await TikTokAuth.findOne({provider: "premierPrinting"})
    let tiktokProduct = {
        save_mode: "LISTING",
        description: product.description,
        title: product.name,
        is_cod_allowed: false,
        package_dimensions: {
            length: "13",
            height: "1",
            width: "10",
            unit: "INCH"
        },
        package_weight: {
            value:( product.blank.sizes[0].weight / 16).toFixed(2),
            unit: "POUND"
        },
        main_images: [],
        skus: [],
        category_version: "v2",
        idempotency_key: `${product.design.sku}_${product.blank.code}`
    }
    let categories = await getRecommendedCategory(product.name, credentials)
    console.log(categories)
    if(categories.error && categories.msg == "refresh"){
        credentials = await refresh(credentials);
        categories = await getRecommendedCategory(product.name, credentials)
    }
    //console.log(categories)
    tiktokProduct.category_id = categories.categories.filter(c=> c.is_leaf == true)[0].id
    let warehouses = await getWarehouses(credentials)
    if(warehouses.error && warehouses.msg == "refresh"){
        credentials = await refresh(credentials);
        warehouses = await await getWarehouses(credentials)
    }
    let warehouse = warehouses.warehouses.filter(w=> w.is_default)[0]
    for(let im of product.images){
        let res = await uploadTikTokImage({image:im, type:"MAIN_IMAGE"})
        if(!res.error) tiktokProduct.main_images.push({uri:res.uri})
    }
    for(let v of product.variants){
        let attributes = []
        let mainImage
        let images = []
        let identifier_code
        for(let im of v.images){
            let res = await uploadTikTokImage({image:im, type:"MAIN_IMAGE"})
            //console.log(res)
            if(!res.error && mainImage == undefined) mainImage = {uri: res.uri}
            else if(!res.error) images.push({uri: res.uri})
        }
        if(v.upc){
            identifier_code= {
                code: v.upc,
                type: "UPC"
            }
        }
        attributes.push({
            name: "Color",
            value_name: v.color.name,
            sku_img: mainImage,
        })
        attributes.push({
            name: "Size",
            value_name: v.size
        })
        if(v.threadColor && v.threadColor.length > 0){
            attributes.push({
                name: "Thread Color",
                value_name: v.threadColor.name
            })
        }
        console.log(attributes)
        tiktokProduct.skus.push({
            sales_attributes: attributes,
            inventory: [{
                warehouse_id: warehouse.id,
                quantity: 1000
            }],
            seller_sku: v.sku,
            identifier_code,
            price: {
                amount: `${v.price.toFixed(2)}`,
                currency: "USD"
            },
        })
    }
    //console.log(tiktokProduct)
    let attributes = await getAttributes(tiktokProduct.category_id, credentials)
    if(attributes.error && attributes.msg == "refresh"){
        credentials = await refresh(credentials);
        attributes = await getAttributes(tiktokProduct.category_id, credentials)
    }
    let attrs = []
    if(product.design.season){
        attrs.push({
            id: attributes.attributes.filter(a=> a.name == "Season")[0].id,
            values: [{
                name: product.design.season
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
    console.log(attributes.attributes.filter(a=> a.is_requried == true))
    if(product.blank.tikTokHeader){
        for(let key of Object.keys(product.blank.tikTokHeader)){
            if(key.toLowerCase() != "CA Prop 65: Repro. Chems".toLowerCase() && key.toLowerCase() != "CA Prop 65: Carcinogens".toLowerCase()){
                let at = attributes.attributes.filter(a=> a.name.toLowerCase() == key.toLowerCase())[0]
                if(at){
                     attrs.push({
                        id: at.id,
                        values: [{
                            name: product.blank.tikTokHeader[key]
                        }]
                    })
                }
            }
        }
    }
    console.log(attrs)
    
    tiktokProduct.product_attributes = attrs
    //console.log(product.blank.sizeGuide)
    if(product.blank.sizeGuide?.images[0]){
        let res = await uploadTikTokImage({image:product.blank.sizeGuide?.images[0], type:"SIZE_CHART_IMAGE"})
        //console.log(res)
        if(!res.error ){
            tiktokProduct.size_chart = {}
            tiktokProduct.size_chart.image = {uri: res.uri}
        }
    }
    let res = await createProduct({tiktokProduct, credentials})
    if(res.error && res.msg == "refresh"){
        credentials = await refresh(credentials);
        res = await createProduct({tiktokProduct, credentials})
    }
    console.log(res.product?.skus[0].sales_attributes)
    let design = await Design.findById(product.design._id)
    for(let bl of design.blanks){
        if(bl._id.toString() == product.blankObj._id.toString()){
            if(!bl.marketPlaceIds){
                bl.marketPlaceIds = {}
            }
            bl.marketPlaceIds["tiktok"] = res.product.product_id
        }
    }
    design.markModified("blanks")
    await design.save()
}

export const getOrders = async (auths)=>{
    let orders = []
    for(let a of auths){
        if(a.pullOrders === false) { console.log(`[tiktok getOrders] skipping ${a.seller_name || a._id} — pullOrders disabled`); continue }  // user opted to pull via ShipStation instead

        // Lazy-fill shop_list if it was never populated — otherwise the loop below
        // never runs and orders pull in silently as zero.
        if (!a.shop_list?.length) {
            console.log(`[tiktok getOrders] ${a.seller_name || a._id} has empty shop_list — fetching authorized shops`);
            let shop = await getAuthorizedShops(a);
            if (shop?.error && shop?.msg == "refresh") {
                a = await refresh(a);
                shop = await getAuthorizedShops(a);
            }
            if (shop?.shop_list?.length) {
                a.shop_list = shop.shop_list;
                await a.save();
            } else {
                console.error(`[tiktok getOrders] ${a.seller_name || a._id} — no authorized shops found, skipping`);
                continue;
            }
        }

        for(let store of a.shop_list){
            let credentials = a
            credentials.shop_cipher = store.shop_cipher
            let res = await getOrdersTikTok({credentials});
            if (res.error && res.msg == "refresh") {
                credentials = await refresh(credentials, store.shop_cipher);
                res = await getOrdersTikTok({ credentials});
            }
            if(res.error) {
                console.error(`[tiktok getOrders] shop ${store.shop_id} fetch failed: ${res.msg}`);
                continue;
            }
            const ords = (res.orders || []).map(o => ({
                ...o,
                orgId: credentials.orgId,
                tikTokShop: { sellerName: credentials.seller_name, sellerId: credentials._id, shopId: store.shop_id },
            }));
            console.log(`[tiktok getOrders] shop ${store.shop_id}: ${ords.length} AWAITING_SHIPMENT order(s)`);
            orders = orders.concat(ords)
        }
    }
    console.log(`[tiktok getOrders] total fetched: ${orders.length}`);
    return orders
}

export const processOrders = async (orders)=>{
    let created = 0, updated = 0, failed = 0;
    for(let o of orders){
      try {
        let order = await Order.findOne({poNumber: o.id}).populate("items")
        if (!order) {
            order = new Order({
                orderId: `${o.create_time}_${o.id}`,
                poNumber: o.id,
                orgId: o.orgId,
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
                // TikTok line items expose `seller_sku` / `sku_name` / `id` (no `sku`/`name`/`orderItemId`).
                // Normalize onto the fields the parser + item builders below read, so blank/color/size/
                // design resolve instead of landing a completely blank item.
                i.sku = i.sku || i.seller_sku;
                i.name = i.name || i.sku_name || i.product_name;
                i.orderItemId = i.id || i.orderItemId;
                console.log(i.seller_sku, i);
                // Catalog (buy-not-build / imported) products: match the variant directly by sku/upc and
                // create a plain item (no blank/color/design). POD products fall through unchanged.
                const catProduct = await Products.findOne({
                    isCatalogProduct: true,
                    $or: [
                        { variantsArray: { $elemMatch: { sku: i.seller_sku } } },
                        { variantsArray: { $elemMatch: { sku: i.sku } } },
                        { variantsArray: { $elemMatch: { upc: i.seller_sku } } },
                        { variantsArray: { $elemMatch: { upc: i.sku } } },
                    ],
                });
                if (catProduct) {
                    const cv = (catProduct.variantsArray || []).find(v =>
                        v.sku === i.seller_sku || v.sku === i.sku || v.upc === i.seller_sku || v.upc === i.sku);
                    if (cv) {
                        const catItem = new Item({
                            pieceId: await generatePieceID(),
                            paid: true,
                            sku: cv.sku || i.seller_sku || i.sku,
                            upc: cv.upc || i.upc,
                            orderItemId: i.id || i.orderItemId,
                            blank: null,
                            styleCode: catProduct.sku || cv.sku || "",
                            sizeName: cv.name || "",
                            colorName: "",
                            color: null,
                            size: null,
                            design: null,
                            designRef: null,
                            order: order._id,
                            shippingType: order.shippingType,
                            quantity: 1,
                            status: order.status,
                            name: i.name,
                            date: order.date,
                            ...(o.orgId ? { orgId: o.orgId } : {}),
                        });
                        await catItem.save();
                        items.push(catItem);
                        continue;
                    }
                }
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
                    // The color segment of the SKU is the color's SKU (lowercase, e.g. "camo"),
                    // not its display name ("Camo") — match on sku first, then case-insensitive name.
                    const colorSku = i.sku?.split("_")[1];
                    color = colorSku
                        ? (await Colors.findOne({ sku: colorSku })
                            || await Colors.findOne({ name: new RegExp(`^${colorSku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }))
                        : null;
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
                        orderItemId: i.id || i.orderItemId,
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
                        orderItemId: i.id || i.orderItemId,
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
                    await item.save();
                    await shirtItem.save();
                    items.push(item);
                    items.push(shirtItem);
                } else if (blank && blank.code == "LGDSET") {
                    let sb = await Blanks.findOne({ code: "LGDSWT" });
                    let shirtItem = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.id || i.orderItemId,
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
                        orderItemId: i.id || i.orderItemId,
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
                    await item.save();
                    await shirtItem.save();
                    items.push(item);
                    items.push(shirtItem);
                } else if (blank && blank.code == "GDTSET") {
                    let sb = await Blanks.findOne({ code: "GDT" });
                    let shirtItem = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.id || i.orderItemId,
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
                        orderItemId: i.id || i.orderItemId,
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
                    await item.save();
                    await shirtItem.save();
                    items.push(item);
                    items.push(shirtItem);
                } else {
                    let item = new Item({
                        pieceId: await generatePieceID(),
                        paid: true,
                        sku: i.sku,
                        upc: i.upc,
                        orderItemId: i.id || i.orderItemId,
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
                    await item.save();
                    items.push(item);
                }
            }
            order.items = items.map(i => i._id);
            await order.save();
            // Scope every item to the same org as the order (covers all SKU branches).
            if (o.orgId) await Item.updateMany({ _id: { $in: order.items } }, { $set: { orgId: o.orgId } });
            // Marketplace dropship: if the seller opted in, purchase + ship CJ-sourced items to the buyer.
            await maybeDropshipOrder(order, items, o.orgId);
            created++;
        } else {
            order.status = o.orderStatus;
            if (order.status == "shipped") {
                await Promise.all(order.items.map(async (i) => {
                    i.status = order.status;
                    i.labelPrinted = true;
                    await i.save();
                }));
            }
            if (order.status == "CANCELLED") {
                await Promise.all(order.items.map(async (i) => {
                    i.status = order.status;
                    i.canceled = true;
                    await i.save();
                }));
            }
            await order.save();
            updated++;
        }
      } catch (e) {
        failed++;
        console.error(`[tiktok processOrders] order ${o?.id} failed: ${e.message}`);
      }
    }
    console.log(`[tiktok processOrders] created: ${created}, updated: ${updated}, failed: ${failed}`);
    return { error: false, created, updated, failed }
}

// Convenience entry point: pull + process orders for EVERY org's TikTok connection in one
// call. The platform is multi-tenant, so we iterate all TikTokAuth records and each order
// is scoped to its connection's orgId (set in getOrders/processOrders). Wired into the main
// pullOrders() cron flow so TikTok orders land alongside the ShipStation/direct-connection
// orders. Counterpart to premier's single-tenant pullTikTokOrders (which scopes by provider).
export async function pullTikTokOrders(orgId) {
    // Scope to one org when an orgId is supplied (per-org cron pull); with no argument it
    // pulls every connection (used by the diagnostic route).
    const auths = await TikTokAuth.find(orgId ? { orgId } : {});
    if (!auths.length) {
        console.log(`[pullTikTokOrders] no TikTokAuth records found${orgId ? ` for org ${orgId}` : ""}`);
        return { error: false, authCount: 0, active: false, pulled: 0, created: 0, updated: 0, failed: 0 };
    }
    // "active" = at least one shop is pulled via the TikTok API (pullOrders !== false).
    // When active, TikTok orders should NOT also be ingested from the ShipStation pull.
    const active = auths.some(a => a.pullOrders !== false);
    const orders = await getOrders(auths);
    const result = await processOrders(orders);
    return { error: false, authCount: auths.length, active, pulled: orders.length, ...result };
}

// Read-only diagnostic for one org's TikTok connection(s): tokens present, pull flag,
// shop_list, and per-shop fetch count or error. Creates nothing.
export async function diagnoseTikTok(orgId) {
    const auths = await TikTokAuth.find(orgId ? { orgId } : {});
    const report = { authCount: auths.length, auths: [] };
    for (let a of auths) {
        const entry = {
            sellerName: a.seller_name || null,
            id: String(a._id),
            orgId: a.orgId ? String(a.orgId) : null,
            pullOrdersFlag: a.pullOrders,
            hasAccessToken: !!a.access_token,
            hasRefreshToken: !!a.refresh_token,
            shopCount: a.shop_list?.length || 0,
            shops: [],
        };
        try {
            if (a.pullOrders === false) { entry.skipped = "pullOrders flag is false (set to pull via ShipStation)"; report.auths.push(entry); continue; }
            if (!a.shop_list?.length) {
                let shop = await getAuthorizedShops(a).catch(e => ({ error: true, msg: e.message }));
                if (shop?.error && shop?.msg === "refresh") { a = await refresh(a); shop = await getAuthorizedShops(a).catch(e => ({ error: true, msg: e.message })); }
                if (shop?.shop_list?.length) { a.shop_list = shop.shop_list; await a.save(); entry.shopListLazyFilled = shop.shop_list.length; }
                else { entry.error = `no authorized shops (${shop?.msg ?? "unknown"})`; report.auths.push(entry); continue; }
            }
            for (let store of a.shop_list) {
                let cred = a; cred.shop_cipher = store.shop_cipher;
                let res = await getOrdersTikTok({ credentials: cred });
                if (res.error && res.msg === "refresh") { cred = await refresh(cred, store.shop_cipher); res = await getOrdersTikTok({ credentials: cred }); }
                entry.shops.push({
                    shopId: store.shop_id,
                    error: res.error || false,
                    msg: res.msg ?? null,
                    awaitingShipmentCount: res.orders?.length ?? 0,
                    sampleOrderIds: (res.orders || []).slice(0, 5).map(o => o.id),
                });
            }
        } catch (e) {
            entry.error = e.message;
        }
        report.auths.push(entry);
    }
    return report;
}

// ----------------------------------------------------------------------------
// Org-scoped TikTok product/attribute creator.
// Mirrors apps/premier-printing/functions/tikTok.js but credential-injected so
// the multi-tenant platform can pass the org's own TikTok connection instead of
// hardcoding a provider. Applies blank.marketPlaceOverrides + product.marketplaceValues
// to product_attributes, renders bullet points into the description, and auto-corrects
// custom attribute values to TikTok's accepted enum values.
// ----------------------------------------------------------------------------
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "")

// Merge every attribute group TikTok returns into one deduped list, matching what the
// modal shows — so compliance/packaging attributes can be matched to a numeric id.
const mergeTikTokAttributes = (attributes) => {
    const raw = attributes?.rawData ?? {}
    const all = Object.entries(raw)
        .filter(([, v]) => Array.isArray(v))
        .flatMap(([, v]) => v)
        .filter(a => a && (a.id || a.name))
    const seen = new Set()
    const merged = all.filter(a => {
        const k = String(a.id ?? a.name)
        if (seen.has(k)) return false
        seen.add(k)
        return true
    })
    return merged.length ? merged : (attributes?.attributes ?? [])
}

const COMPLIANCE_HINTS = [
    {
        inputs: new Set(["none","no","na","notapplicable","nodangerousgoods","nodangerousgood",
                         "nohazardousmaterials","nohazardousmaterial","nohazmat","nohazard",
                         "notdangerous","nondangerous","notahazardousmaterial","notahazard",
                         "notahazardousgood","notadangerousgood","false","0","notdangerousgoods"]),
        hints: ["none", "no"]
    },
    {
        inputs: new Set(["lithiumbattery","lithiumbatteries","liion","lipo","lithiumion",
                         "lithiumionbattery","lithiumionbatteries"]),
        hints: ["lithium", "battery", "batteries"]
    },
    { inputs: new Set(["flammable","flammableliquid","flammableliquids"]), hints: ["flammable"] },
    { inputs: new Set(["aerosol","aerosols"]), hints: ["aerosol"] },
]

function normalizeAttrValuePreSend(customValue, validValues) {
    if (!validValues?.length) return null
    const normCustom = norm(customValue)
    let match = validValues.find(v => norm(v.name) === normCustom)
    if (match) return match
    for (const rule of COMPLIANCE_HINTS) {
        if (rule.inputs.has(normCustom)) {
            const hintMatch = validValues.find(v => rule.hints.some(h => norm(v.name).includes(h)))
            if (hintMatch) return hintMatch
        }
    }
    match = validValues.find(v => norm(v.name).includes(normCustom) || normCustom.includes(norm(v.name)))
    if (match) return match
    return null
}

// Upload an image using the supplied (org) credentials, refreshing tokens once on expiry.
async function uploadImageWithCreds(image, type, credentials) {
    let res = await uploadProductImage(image, credentials, type)
    if (res.error && (res.msg === "refresh" || res.error?.msg === "refresh")) {
        credentials = await refresh(credentials)
        res = await uploadProductImage(image, credentials, type)
    }
    return res
}

// Ensure the connection has a populated shop_list (required by all product API calls).
async function ensureShopList(credentials) {
    if (credentials.shop_list?.length) return credentials
    let shop = await getAuthorizedShops(credentials)
    if (shop?.error) {
        credentials = await refresh(credentials)
        shop = await getAuthorizedShops(credentials)
    }
    if (shop?.shop_list?.length) {
        credentials.shop_list = shop.shop_list
        await credentials.save()
    } else {
        throw new Error("TikTok shop_list is empty — no authorized shops found")
    }
    return credentials
}

// Fetch the merged TikTok attribute list for a product name, using the org's credentials.
// Powers the "TikTok Attribute Reference" dialog in the shared MarketPlaceModal.
export async function getTikTokAttributesForName(productName = "t-shirt", credentials) {
    if (!credentials) return { error: true, msg: "No TikTok credentials found" }
    credentials = await ensureShopList(credentials)
    let categories = await getRecommendedCategory(productName, credentials)
    if (categories.error && categories.msg === "refresh") {
        credentials = await refresh(credentials)
        categories = await getRecommendedCategory(productName, credentials)
    }
    if (categories.error || !categories.categories?.length) {
        return { error: true, msg: categories.msg ?? "No categories found" }
    }
    const category = categories.categories.find(c => c.is_leaf)
    if (!category) return { error: true, msg: "No leaf category found" }
    let attributes = await getAttributes(category.id, credentials)
    if (attributes.error && attributes.msg === "refresh") {
        credentials = await refresh(credentials)
        attributes = await getAttributes(category.id, credentials)
    }
    if (attributes.error) return { error: true, msg: attributes.msg }

    const raw = attributes.rawData ?? {}
    const allAttrs = Object.entries(raw)
        .filter(([, v]) => Array.isArray(v))
        .flatMap(([, v]) => v)
        .filter(a => a && (a.id || a.name))
    const seen = new Set()
    const merged = allAttrs.filter(a => {
        const key = String(a.id ?? a.name)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })

    return {
        error: false,
        categoryId: category.id,
        categoryName: category.local_name,
        attributes: merged.length ? merged : (attributes.attributes ?? [])
    }
}

// Create a TikTok product listing for the org, applying selected attributes + bullet points.
export async function createTikTokListing({ product, credentials, marketplaceName = null }) {
    if (!credentials) throw new Error("No TikTok credentials provided")
    credentials = await ensureShopList(credentials)

    const brand_id = product.brand
        ? await getOrCreateBrandTikTok(product.brand, credentials, credentials.shop_list[0].shop_cipher)
        : null

    // TikTok has no native bullet-point field — render bullets into the description HTML.
    const escapeHtml = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const bulletItems = (product.blank.bulletPoints ?? [])
        .slice(0, 5)
        .map(bp => [bp.title, bp.description].filter(Boolean).map(escapeHtml).join(": "))
        .filter(Boolean)
    // TikTok has no tags/keywords field — append product tags as a discrete trailing line.
    const tagItems = (product.tags ?? []).map(t => String(t ?? "").trim()).filter(Boolean).map(escapeHtml)
    let description = product.description ?? ""
    if (bulletItems.length) description += `<ul>${bulletItems.map(b => `<li>${b}</li>`).join("")}</ul>`
    if (tagItems.length) description += `<p>Tags: ${tagItems.join(", ")}</p>`

    let tiktokProduct = {
        save_mode: "LISTING",
        description,
        title: product.name,
        ...(brand_id ? { brand_id } : {}),
        is_cod_allowed: false,
        package_dimensions: {
            length: String(product.packageLength ?? product.marketplaceValues?.["Package Length"] ?? "13"),
            width:  String(product.packageWidth  ?? product.marketplaceValues?.["Package Width"]  ?? "10"),
            height: String(product.packageHeight ?? product.marketplaceValues?.["Package Height"] ?? "1"),
            unit: "INCH"
        },
        package_weight: {
            value: (((product.blank.sizes?.[0]?.weight ?? 8) / 16)).toFixed(2),
            unit: "POUND"
        },
        main_images: [],
        skus: [],
        category_version: "v2",
        idempotency_key: `${product.design?.sku ?? product.name}_${product.blank.code}`,
    }

    // Use the blank name (not the full design+blank title) for category recommendation so the
    // category matches the one the modal used when the user selected attributes.
    const categoryQuery = product.blank?.name || product.name
    let categories = await getRecommendedCategory(categoryQuery, credentials)
    if (categories.error && categories.msg === "refresh") {
        credentials = await refresh(credentials)
        categories = await getRecommendedCategory(categoryQuery, credentials)
    }
    tiktokProduct.category_id = categories.categories.filter(c => c.is_leaf == true)[0].id

    let warehouses = await getWarehouses(credentials)
    if (warehouses.error && warehouses.msg === "refresh") {
        credentials = await refresh(credentials)
        warehouses = await getWarehouses(credentials)
    }
    let warehouse = warehouses.warehouses.filter(w => w.is_default)[0]

    for (let im of (product.images ?? [])) {
        let res = await uploadImageWithCreds(im, "MAIN_IMAGE", credentials)
        if (!res.error) tiktokProduct.main_images.push({ uri: res.uri })
    }

    for (let v of product.variants) {
        let attributes = []
        let mainImage
        let identifier_code
        for (let im of (v.images ?? [])) {
            let res = await uploadImageWithCreds(im, "MAIN_IMAGE", credentials)
            if (!res.error && mainImage == undefined) mainImage = { uri: res.uri }
        }
        if (v.upc) identifier_code = { code: v.upc, type: "UPC" }
        attributes.push({ name: "Color", value_name: v.color?.name ?? v.colorName, sku_img: mainImage })
        attributes.push({ name: "Size", value_name: typeof v.size === "string" ? v.size : v.size?.name })
        if (v.threadColor && v.threadColor.length > 0) {
            attributes.push({ name: "Thread Color", value_name: v.threadColor.name })
        }
        tiktokProduct.skus.push({
            sales_attributes: attributes,
            inventory: [{ warehouse_id: warehouse.id, quantity: 1000 }],
            seller_sku: v.sku,
            identifier_code,
            price: { amount: `${(v.price ?? 0).toFixed(2)}`, currency: "USD" },
        })
    }

    let attributes = await getAttributes(tiktokProduct.category_id, credentials)
    if (attributes.error && attributes.msg === "refresh") {
        credentials = await refresh(credentials)
        attributes = await getAttributes(tiktokProduct.category_id, credentials)
    }
    // Merge all attribute groups so compliance/packaging selections map to a numeric id.
    const catAttrs = mergeTikTokAttributes(attributes)
    const unresolvedAttributes = []
    let attrs = []
    if (product.design?.season) {
        const seasonAttr = catAttrs.find(a => a.name == "Season")
        if (seasonAttr) attrs.push({ id: String(seasonAttr.id), values: [{ name: product.design.season }] })
    }
    const carcAttr = catAttrs.find(a => a.name == "CA Prop 65: Carcinogens")
    if (carcAttr) attrs.push({ id: String(carcAttr.id), values: [{ id: "1000059", name: "No" }] })
    const reproAttr = catAttrs.find(a => a.name == "CA Prop 65: Repro. Chems")
    if (reproAttr) attrs.push({ id: String(reproAttr.id), values: [{ id: "1000059", name: "No" }] })

    // Apply blank.marketPlaceOverrides keyed by attribute name OR id.
    const allOverrides = product.blank.marketPlaceOverrides ?? {}
    const mpOverrides = (marketplaceName && allOverrides[marketplaceName])
        ? allOverrides[marketplaceName]
        : (Object.entries(allOverrides).find(([k]) => k.toLowerCase().includes("tiktok") || k.toLowerCase() === "tik tok")?.[1] ?? {})
    for (const [key, value] of Object.entries(mpOverrides)) {
        if (!value) continue
        // Match by name first, then accept a numeric ID key. Never send a name as the id.
        const tikAttr = catAttrs.find(a =>
            a.name?.toLowerCase() === key.toLowerCase() || String(a.id) === String(key)
        )
        const attrId = tikAttr ? String(tikAttr.id) : (/^\d+$/.test(String(key)) ? String(key) : null)
        if (!attrId) { unresolvedAttributes.push(key); continue }
        const idx = attrs.findIndex(a => String(a.id) === attrId)
        const entry = { id: attrId, values: [{ name: value }] }
        if (idx >= 0) attrs[idx] = entry
        else attrs.push(entry)
    }

    // Apply product-specific TikTok attributes from product.marketplaceValues.
    const PACKAGE_DIMENSION_KEYS = new Set(["package length", "package width", "package height"])
    for (const [key, value] of Object.entries(product.marketplaceValues ?? {})) {
        if (!value || key === 'name' || key === 'titleGenerator') continue
        if (PACKAGE_DIMENSION_KEYS.has(key.toLowerCase())) continue
        const tikAttr = catAttrs.find(a =>
            a.name?.toLowerCase() === key.toLowerCase() || String(a.id) === String(key)
        )
        if (!tikAttr) continue
        const attrId = String(tikAttr.id)
        const idx = attrs.findIndex(a => String(a.id) === attrId)
        const entry = { id: attrId, values: [{ name: value }] }
        if (idx >= 0) attrs[idx] = entry
        else attrs.push(entry)
    }

    // Pre-send normalization: resolve plain custom value names to TikTok value ids.
    for (const attr of attrs) {
        if (!attr.values?.[0]?.name) continue
        if (attr.values[0].id) continue
        const tikAttr = catAttrs.find(a => String(a.id) === String(attr.id))
        const validValues = tikAttr?.values ?? []
        if (!validValues.length) continue
        const resolved = normalizeAttrValuePreSend(attr.values[0].name, validValues)
        if (resolved) attr.values = [{ id: resolved.id, name: resolved.name }]
    }

    // Final safety net: drop any attribute whose id isn't a numeric TikTok attribute id.
    attrs = attrs.filter(a => /^\d+$/.test(String(a.id)))

    console.log("[TikTok] category", tiktokProduct.category_id,
        "| override keys:", Object.keys(mpOverrides),
        "| attributes sent:", attrs.map(a => a.id),
        "| skipped (no matching attribute in this category):", unresolvedAttributes)

    tiktokProduct.product_attributes = attrs

    if (product.blank.sizeGuide?.images?.[0]) {
        let res = await uploadImageWithCreds(product.blank.sizeGuide.images[0], "SIZE_CHART_IMAGE", credentials)
        if (!res.error) tiktokProduct.size_chart = { image: { uri: res.uri } }
    }

    let res = await createProduct({ tiktokProduct, credentials })
    if (res.error && res.msg === "refresh") {
        credentials = await refresh(credentials)
        res = await createProduct({ tiktokProduct, credentials })
    }

    // TikTok error 12052247 — attribute does not support custom value names.
    const fixedAttributes = []
    const droppedAttributes = []
    while (res.error && res.msg?.includes('Custom names are not supported')) {
        const attrIdMatch = res.msg.match(/\(ID:\s*(\d+)\)/)
        if (!attrIdMatch) break
        const attrId = attrIdMatch[1]
        const attrNameMatch = res.msg.match(/attribute\s+([\w][\w\s]*?)\s+\(ID:/)
        const attrLabel = attrNameMatch?.[1]?.trim() ?? `ID ${attrId}`

        const badAttr = (tiktokProduct.product_attributes ?? []).find(a => String(a.id) === attrId)
        const customValue = badAttr?.values?.[0]?.name ?? ""

        let validAttrs = await getAttributes(tiktokProduct.category_id, credentials)
        if (validAttrs.error && validAttrs.msg === "refresh") {
            credentials = await refresh(credentials)
            validAttrs = await getAttributes(tiktokProduct.category_id, credentials)
        }
        const validAttr = (validAttrs.attributes ?? []).find(a => String(a.id) === attrId)
        const validValues = validAttr?.values ?? []

        const normCustom = norm(customValue)
        const match = validValues.find(v => norm(v.name) === normCustom)
            ?? validValues.find(v => norm(v.name).includes(normCustom) || normCustom.includes(norm(v.name)))
            ?? validValues.find(v => {
                const words = normCustom.split(/\s+/).filter(w => w.length > 2)
                return words.some(w => norm(v.name).includes(w))
            })

        if (match) {
            tiktokProduct.product_attributes = (tiktokProduct.product_attributes ?? []).map(a =>
                String(a.id) === attrId ? { ...a, values: [{ id: match.id, name: match.name }] } : a
            )
            fixedAttributes.push(`${attrLabel} ("${customValue}" → "${match.name}")`)
        } else {
            tiktokProduct.product_attributes = (tiktokProduct.product_attributes ?? []).filter(a => String(a.id) !== attrId)
            droppedAttributes.push(`${attrLabel} ("${customValue}" had no matching valid value)`)
        }

        res = await createProduct({ tiktokProduct, credentials })
        if (res.error && res.msg === "refresh") {
            credentials = await refresh(credentials)
            res = await createProduct({ tiktokProduct, credentials })
        }
    }

    if (res.error) throw new Error(res.msg ?? "TikTok product creation failed")

    const warningParts = []
    if (fixedAttributes.length) warningParts.push(`Attribute values auto-corrected to match TikTok's accepted values: ${fixedAttributes.join('; ')}.`)
    if (droppedAttributes.length) warningParts.push(`Attributes removed because no matching TikTok value was found: ${droppedAttributes.join('; ')}.`)
    if (unresolvedAttributes.length) warningParts.push(`Attributes skipped because they don't match a TikTok attribute for this category: ${unresolvedAttributes.join('; ')}.`)
    const warning = warningParts.length ? warningParts.join(' ') : null
    return { tiktokProductId: res.product?.product_id, warning }
}