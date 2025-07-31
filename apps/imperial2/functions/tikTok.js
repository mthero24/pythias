import TikTokAuth from "@/models/tiktok"
import {
  getAuthorizedShops,
  getAccessTokenFromRefreshToken,
  uploadProductImage,
  getRecommendedCategory,
  getWarehouses,
  getAttributes,
  createProduct,
  getOrdersTikTok,
} from "@pythias/integrations";
import {Design, Order, SkuToUpc, Colors, Blanks, Item} from "@pythias/mongo";
import {generatePieceID } from "@pythias/integrations";
const refresh = async (creds, cipher) =>{
    let credentials = await TikTokAuth.findOne({ _id: creds._id });
    console.log("refresh +++++")
    let access_token = await getAccessTokenFromRefreshToken(
        credentials.refresh_token
    );
    //console.log(access_token, "access token");
    for (let key of Object.keys(access_token)) {
        credentials[key] = access_token[key];
    }
    credentials.date = new Date(Date.now());
    credentials = await credentials.save();
    credentials.shop_cipher = cipher;
    return credentials
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
            sku_image:  mainImage,
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