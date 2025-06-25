import TikTokAuth from "@/models/tiktok"
import {getAuthorizedShops, getAccessTokenFromRefreshToken, uploadProductImage, getRecommendedCategory, getWarehouses, getAttributes, createProduct} from "@pythias/integrations"
import Design from "@/models/Design";
export async function getShops(){
    let credentials = await TikTokAuth.findOne({provider: "premierPrinting"})
    let shop = await getAuthorizedShops(credentials)
    if(shop.error && shop.msg == "refresh"){
        let access_token = await getAccessTokenFromRefreshToken(credentials.refresh_token)
        console.log(access_token, "access token")
        for(let key in Object.keys(access_token)){
            credentials[key] = access_token[key]
            credentials.date= new Date(Date.now())
            credentials = await credentials.save()
        }
        shop = await getAuthorizedShops(credentials)
    } 
    credentials.shop_list = shop.shop_list
    await credentials.save()
}

export async function uploadTikTokImage({image,type}){
    let credentials = await TikTokAuth.findOne({provider: "premierPrinting"})
    let res = await uploadProductImage(image, credentials, type)
    if(res.error && res.error.msg == "refresh"){
        let access_token = await getAccessTokenFromRefreshToken(credentials.refresh_token)
        console.log(access_token, "access token")
        for(let key in Object.keys(access_token)){
            credentials[key] = access_token[key]
            credentials.date= new Date(Date.now())
            credentials = await credentials.save()
        }
        let res = await uploadProductImage(image, credentials, type)
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
    if(categories.error && categories.error.msg == "refresh"){
        let access_token = await getAccessTokenFromRefreshToken(credentials.refresh_token)
        console.log(access_token, "access token")
        for(let key in Object.keys(access_token)){
            credentials[key] = access_token[key]
            credentials.date= new Date(Date.now())
            credentials = await credentials.save()
        }
        categories = await getRecommendedCategory(product.name, credentials)
    }
    //console.log(categories)
    tiktokProduct.category_id = categories.categories.filter(c=> c.is_leaf == true)[0].id
    let warehouses = await getWarehouses(credentials)
    if(warehouses.error && warehouses.error.msg == "refresh"){
        let access_token = await getAccessTokenFromRefreshToken(credentials.refresh_token)
        console.log(access_token, "access token")
        for(let key in Object.keys(access_token)){
            credentials[key] = access_token[key]
            credentials.date= new Date(Date.now())
            credentials = await credentials.save()
        }
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
    if(attributes.error && attributes.error.msg == "refresh"){
        let access_token = await getAccessTokenFromRefreshToken(credentials.refresh_token)
        console.log(access_token, "access token")
        for(let key in Object.keys(access_token)){
            credentials[key] = access_token[key]
            credentials.date= new Date(Date.now())
            credentials = await credentials.save()
        }
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
    if(res.error && res.error.msg == "refresh"){
        let access_token = await getAccessTokenFromRefreshToken(credentials.refresh_token)
        console.log(access_token, "access token")
        for(let key in Object.keys(access_token)){
            credentials[key] = access_token[key]
            credentials.date= new Date(Date.now())
            credentials = await credentials.save()
        }
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