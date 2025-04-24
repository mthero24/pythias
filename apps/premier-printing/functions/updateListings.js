import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import CSVUpdates from "@/models/CSVUpdates"
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
import {getOrderKohls, NextGTIN, CreateUpdateUPC, getTokenAcenda, getItemsWalmart, retireItemWalmart, getSpecWalmart, bulkUploadWalmart, getFeedWalmart, getWarehouseAcenda, getCatalogAcenda, getSkuAcenda, addInventoryAcenda} from "@pythias/integrations"
import { createUpc } from "@/functions/createUpcs"
const s3 = new S3Client({ credentials:{
    accessKeyId:'XWHXU4FP7MT2V842ITN9',
   secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
}, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3

const createTargetProduct = ({p, product, material,material_1, material_percentage_1, material_2, material_percentage_2, garment_fit, textile_dry_recommendation,textile_wash_recommendation, bullet1, bullet2, bullet4})=>{
    console.log(
        "create product", `${p.design.sku}_${p.blank.blank.code}`
    )
    return {
        id: product && product[0]? product[0].id: null,
        name: p.name,
        brand: p.brand,
        sku: `${p.design.sku}_${p.blank.blank.code}`,
        description: `${p.design.description} ${p.blank.blank.description}`,
        "options.0": 'size',
        "options.1": 'color',
        material_1: material,
        material_percentage_1, 
        material_2, 
        material_percentage_2,
        garment_fit,
        pattern: "Solid",
        bullet_1: bullet1,
        bullet_2: bullet2,
        bullet_3: "Great to pair with any casual outfit.",
        bullet_4: bullet4,
        fabric_weight_type: "Light Weight Fabric",
        garment_construction_details: "",
        gender: p.blank.blank.department == "Womens"? "Womens": "uni-sex",
        pattern_group: "Solid",
        size_grouping: p.blank.blank.department,
        targeted_audience: p.blank.blank.category[0].toLowerCase() == "baby"? "Infant (0-12month)": p.blank.blank.name.includes("Toddler")? "Toddler (1-3 years)": p.blank.blank.department.toLowerCase() == "kids"? "Child (3-9 years)": "Adult (18 Years and Up)",
        textile_dry_recommendation,
        textile_wash_recommendation,
        garment_closure_type_tops: p.blank.blank.name.includes("Zip")? "Zipper": "Pull Over",
        garment_neckline_type: p.blank.blank.name.includes("Hat")? null: "Crew",
        garment_sleeve_length_type: p.blank.blank.name.includes("Long Sleeve") || p.blank.blank.name.includes("Sweatshirt") || p.blank.blank.name.includes("Hoodie") || p.blank.blank.name.includes("fleece")? "Long Sleeve": p.blank.blank.name.includes("Hat") || p.blank.blank.name.includes("Tote") || p.blank.blank.name.includes("Pillow")? null: "Short Sleeve",
        garment_sleeve_style: p.blank.blank.name.includes("flutter Sleeve")? "Flutter Sleeve": "Basic Sleeve",
        garment_torso_length: p.blank.blank.name.includes("Crop")? "Above Waist": "To Waist",
        item_style: p.blank.name,
        import_description: "made in the USA and imported",
        prop_65: "No",
        tax: "General Clothing",
        apparel_material_1: material,
        apparel_and_accessories_subtype: p.blank.blank.category? p.blank.blank.category[0]: p.blank.blank.department,
        textile_construction: p.blank.blank.construction? p.blank.blank.construction:"Woven",
        group: "product"
    }
}
const createTargetVariant = ({p,item, v, price, bImages, material, material_1, material_percentage_1, material_2, material_percentage_2, garment_fit, textile_dry_recommendation,textile_wash_recommendation, bullet1, bullet2, bullet4})=>{
    console.log("make variant", v.sku)
    const sizes = {s: "Small", XS: "X Small", M: "Medium", L: "Large", "XL": "X Large", "2XL": "XX Large"}
    return {
        id: item && item[0]? item[0].id: null,
        "name": `${p.name} - ${v.size.name} - ${v.color.name}`,
        gtin: v.gtin,
        "description": `${p.design.description} ${p.blank.blank.description}`,
        brand: p.brand,
        "sku": v.sku,
        material_1: material,
        material_percentage_1, 
        material_2, 
        material_percentage_2,
        garment_fit,
        pattern: "Solid",
        bullet_1: bullet1,
        bullet_2: bullet2,
        bullet_3: "Great to pair with any casual outfit.",
        bullet_4: bullet4,
        size_grouping: p.blank.blank.department,
        targeted_audience: p.blank.blank.category[0].toLowerCase() == "baby"? "Infant (0-12month)": p.blank.blank.name.includes("Toddler")? "Toddler (1-3 years)": p.blank.blank.department.toLowerCase() == "kids"? "Child (3-9 years)": "Adult (18 Years and Up)",
        textile_dry_recommendation,
        textile_wash_recommendation,
        garment_closure_type_tops: p.blank.blank.name.includes("Zip")? "Zipper": "Pull Over",
        garment_neckline_type: p.blank.blank.name.includes("Hat")? null: "Crew",
        garment_sleeve_length_type: p.blank.blank.name.includes("Long Sleeve") || p.blank.blank.name.includes("Sweatshirt") || p.blank.blank.name.includes("Hoodie") || p.blank.blank.name.includes("fleece")? "Long Sleeve": p.blank.blank.name.includes("Hat") || p.blank.blank.name.includes("Tote") || p.blank.blank.name.includes("Pillow")? null: "Short Sleeve",
        garment_sleeve_style: p.blank.blank.name.includes("flutter Sleeve")? "Flutter Sleeve": "Basic Sleeve",
        garment_torso_length: p.blank.blank.name.includes("Crop")? "Above Waist": "To Waist",
        item_style: p.blank.name,
        import_description: "made in the USA and imported",
        prop_65: "No",
        garment_collar_type: p.blank.blank.collar? p.blank.blank.collar: "No Collar",
        tax: "General Clothing",
        apparel_material_1: material,
        apparel_and_accessories_subtype: p.blank.blank.category? p.blank.blank.category[0]: p.blank.blank.department,
        textile_construction: p.blank.blank.construction? p.blank.blank.construction:"Woven",
        "variant.barcode": v.upc,
        "variant.price": price.toFixed(2),
        "pricing_item.price.amount": price.toFixed(2),
        "variant.position": v.size.name == "XS" || v.size.name == "2T" || v.size.name == "NB"? 10: v.size.name == "S" || v.size.name == "3T" || v.size.name == "6M"? 20: v.size.name == "M" || v.size.name == "4T" || v.size.name == "12M"? 30: v.size.name == "L" || v.size.name == "5/6" || v.size.name == "18M"? 40: v.size.name == "XL" || v.size.name == "24M"? 50: v.size.name == "2XL"? 60: 10,
        "variant.inventory": 1000,
        "variant.package_width": 9,
        "variant.package_height": 1,
        "variant.package_length": 13,
        "variant.weight": v.size.weight? v.size.weight: 0.3,
        "pattern": "Solid",
        "variant.color_family": v.color.colorFamily,
        "variant.color": v.color.name,
        "gender":  p.blank.blank.department == "Womens"? "Womens": "uni-sex",
        "variant.size": v.size.name,
        group: "variant",
        "group_skus.0": `${p.design.sku}_${p.blank.blank.code}`,
        "images.default.main.url": bImages[0],
        "images.default.1.alternate.url": bImages[1],
        "images.default.2.alternate.url": bImages[2],
        "images.default.3.alternate.url": p.blank.blank.sizeGuide?.images? p.blank.blank.sizeGuide?.images[0]: null,
        "images.default.4.alternate.url": p.blank.blank.sizeGuide?.images? p.blank.blank.sizeGuide?.images[1]: null,
        "images.default.5.alternate.url": bImages[3],
        "images.default.6.alternate.url": bImages[4],
        "images.default.7.alternate.url": bImages[5],
    }
}

let targetHeader = [
    {id: "id", title: "id"},
    {id: "name", title: "name"},
    {id: "brand", title: "fields.brand"},
    {id: "sku", title: "sku"},
    {id: "description", title: "fields.description"},
    {id: "options.0", title: "options.0"},
    {id: "options.1", title: "options.1"},
    {id: "material_1", title: "fields.apparel_material_1"},
    {id: "material_percentage_1", title: "fields.apparel_material_1_percentage"},
    {id: "material_2", title: "fields.apparel_material_2"},
    {id: "material_percentage_2", title: "fields.apparel_material_2_percentage"},
    {id: "pattern", title: "fields.pattern"},
    {id: "bullet_1", title: "fields.bullet_1"},
    {id: "bullet_2", title: "fields.bullet_2"},
    {id: "bullet_3", title: "fields.bullet_3"},
    {id: "bullet_4", title: "fields.bullet_4"},
    {id: "fabric_weight_type", title: "fields.fabric_weight_type"},
    {id: "garment_construction_details", title: "fields.garment_construction_details"},
    {id: "gender", title: "fields.gender"},
    {id: "pattern_group", title: "fields.pattern_group"},
    {id: "size_grouping", title: "fields.size_grouping"},
    {id: "targeted_audience", title: "fields.targeted_audience"},
    {id: "textile_dry_recommendation", title: "fields.textile_dry_recommendation"},
    {id: "textile_wash_recommendation", title: "fields.textile_wash_recommendation"},
    {id: "garment_fit", title: "fields.garment_fit"},
    {id: "garment_closure_type_tops", title: "fields.garment_closure_type_tops"},
    {id: "garment_neckline_type", title: "fields.garment_neckline_type"},
    {id: "garment_sleeve_length_type", title: "fields.garment_sleeve_length_type"},
    {id: "garment_sleeve_style", title: "fields.garment_sleeve_style"},
    {id: "garment_torso_length", title: "fields.garment_torso_length"},
    {id: "import_description", title: "fields.import_description"},
    {id: "prop_65", title: "fields.prop_65"},
    {id: "tax", title: "fields.tax"},
    {id: "apparel_and_accessories_subtype", title: "fields.subtype"},
    {id: "season", title: "fields.season_or_event_depiction"},
    {id: "season", title: "fields.season"},
    {id: "textile_construction", title: "fields.textile_construction"},
    {id: "group", title: "group"},
    {id: "variant.barcode", title: "upc"},
    {id: "gtin", title: "gtin"},
    {id: "variant.price", title: "pricing_item.msrp.amount"},
    {id: "pricing_item.price.amount", title: "pricing_item.price.amount"},
    {id: "variant.package_width", title: "fields.package_width.value"},
    {id: "variant.package_height", title: "fields.package_height.value"},
    {id: "variant.package_length", title: "fields.package_length.value"},
    {id: "variant.package_weight", title: "fields.package_weight.value"},
    {id: "variant.color_family", title: "fields.color_family"},
    {id: "variant.color", title: "fields.color"},
    {id: "variant.size", title: "fields.size"},
    {id: "group_skus.0", title: "group_skus.0"},
    {id: "images.default.main.url", title: "images.default.main.url"},
    {id: "images.default.1.alternate.url", title: "images.default.1.alternate.url"},
    {id: "images.default.2.alternate.url", title: "images.default.2.alternate.url"},
    {id: "images.default.3.alternate.url", title: "images.default.3.alternate.url"},
    {id: "images.default.4.alternate.url", title: "images.default.4.alternate.url"},
    {id: "images.default.5.alternate.url", title: "images.default.5.alternate.url"},
    {id: "images.default.6.alternate.url", title: "images.default.6.alternate.url"},
    {id: "images.default.7.alternate.url", title: "images.default.7.alternate.url"},
]
let kohlsHeader = [
    {id: "product_category", title: "id"},
    {id: "upc_number", title: "upc_number"},
    {id: "title", title: "title"},
    {id: "brand", title: "brand"},
    {id: "meta_description", title: "meta_description"},
    {id: "style_number", title: "style_number"},
    {id: "style_description", title: "style_description"},
    {id: "display_color", title: "display_color"},
    {id: "color_family", title: "color_family"},
    {id: "main_image", title: "main_image"},
    {id: "alt_image_1", title: "alt_image_1"},
    {id: "alt_image_2", title: "alt_image_2"},
    {id: "alt_image_3", title: "alt_image_3"},
    {id: "alt_image_4", title: "alt_image_4"},
    {id: "feature_1", title: "feature_1"},
    {id: "feature_2", title: "feature_2"},
    {id: "feature_3", title: "feature_3"},
    {id: "feature_4", title: "feature_4"},
    {id: "feature_5", title: "feature_5"},
    {id: "feature_6", title: "feature_6"},
    {id: "fabric_material", title: "fabric_material"},
    {id: "origin", title: "origin"},
    {id: "choking_hazard", title: "choking_hazard"},
    {id: "perishable_indicator", title: "perishable_indicator"},
    {id: "containsPFAS", title: "containsPFAS"},
]
const doUPC = async ({design, blank})=>{
    let soemthing = await createUpc({design, blank})
    return soemthing
}
const update = async(csvupdate, url, brand, marketplace )=>{
    console.log(brand, marketplace)
    let csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
    if(!csvUpdate.files) csvUpdate.files={}
    console.log(csvUpdate.files)
    csvUpdate.files[`${brand}_${marketplace}`] = `https://images1.pythiastechnologies.com/${url}`
    csvUpdate.dataParsed = true
    csvUpdate.csvReady= true
    csvUpdate.active = false
    csvUpdate.markModified("files")
    console.log(csvUpdate.files)
    csvUpdate = await csvUpdate.save()
}
export async function updateListings(csvupdate){
    let csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
    try{
        let designs = await Design.find({published: true}).populate("brands b2m blanks.blank blanks.colors blanks.defaultColor").sort({'_id': -1}).limit(1000)
        let brands = {}
        let i = 0
        //console.log(designs.length, designs[0].blanks[0].blank.sizeGuide,)
        for(let design of designs){
            console.log(i, "designs finished")
            i++
            //console.log(design.blanks.length)
            if(design.blanks.length > 0){
                for(let brand of design.brands){
                    // console.log(brand)
                    //console.log(design.b2m.filter(b2m=> b2m.brand == brand.name)[0])
                    let b2m = design.b2m.filter(b2m=> b2m.brand == brand.name)[0]
                    if(b2m){
                        //console.log(b2m)
                        if(!brands[brand.name]) brands[brand.name] = {}
                        for(let m of b2m.marketPlaces){
                            let marketplace = m
                            if(m == "Shien") marketplace = "Shein"
                            if(m == "shopify") marketplace = "Shopify"
                            if(m == "amazon") marketplace = "Amazon"
                            if(!brands[brand.name][marketplace]) brands[brand.name][marketplace] = []
                            //console.log(brands[brand.name][marketplace].length)
                        }
                        for(let b of design.blanks){
                            //console.log(`${brand.name} ${design.name} ${b.blank.name}`, brand.name, `${design.description} ${b.blank.description}`)
                            let variants = []
                            let skus = await SkuToUpc.find({design: design._id, blank: b.blank._id})
                            if(skus.length < (b.colors.length * b.blank.sizes.length)) await doUPC({design, blank: b.blank._id})
                            for(let c of b.colors){
                                for(let s of b.blank.sizes){
                                    let upc = await SkuToUpc.findOne({sku: `${b.blank.code}_${c.name}_${s.name}_${design.sku}`})
                                    if(!upc) upc = await SkuToUpc.findOne({design: design._id, blank: b.blank._id, color: c._id, size: s.name})
                                    if(upc){
                                        let v = {
                                            upc: upc?.upc,
                                            sku: upc?.sku,
                                            gtin: upc?.gtin,
                                            size: s,
                                            color: c
                                        }
                                        variants.push(v)
                                    }
                                }
                            }
                            let product = {
                                name: `${brand.name} ${design.name} ${b.blank.name}`,
                                brand: brand.name,
                                design: design,
                                blank: b,
                                options: ["color", "size"],
                                variants: variants

                                
                            }
                            for(let m of b2m.marketPlaces){
                                let marketplace = m
                                if(m == "Shien") marketplace = "Shein"
                                if(m == "shopify") marketplace = "Shopify"
                                if(m == "amazon") marketplace = "Amazon"
                                if(brand.name == "The Juniper Shop" && product.blank.blank.department.toLowerCase() == "kids"){
                                    brands[brand.name][marketplace].push(product)
                                }else if(brand.name == "Simply Sage Market" && product.blank.blank.department.toLowerCase() != "kids"){
                                    brands[brand.name][marketplace].push(product)
                                }else if(brand.name != "The Juniper Shop" && brand.name != "Simply Sage Market"){
                                    brands[brand.name][marketplace].push(product)
                                }
                            }
                        }
                    }
                }
            }
        }
        csvUpdate.infoGathered = true
        csvUpdate = await csvUpdate.save()
        Object.keys(brands).map(b=>{
            Object.keys(brands[b]).map(async m=>{
                //console.log(b, m, brands[b][m].length)
                if(m.toLowerCase() == "target"){
                    console.log("make a target product csv")
                    
                    let products = [] 
                    let j = 0
                    for(let p of brands[b][m]){
                        j++
                        console.log(brands[b][m].length, j)
                        let credentials
                        if(b == "Simply Sage Market"){
                            credentials = {clientId: process.env.acendaClientIdSS, clientSecret: process.env.acendaClientSecretSS, organization: process.env.acendaOrganizationSS}
                        }else if(b == "The Juniper Shop") {
                            credentials = {clientId: process.env.acendaClientIdJS, clientSecret: process.env.acendaClientSecretJS, organization: process.env.acendaOrganizationJS}
                        }
                        let material 
                        let material_1
                        let material_percentage_1
                        let material_2
                        let material_percentage_2
                        let textile_dry_recommendation 
                        let textile_wash_recommendation
                        let garment_fit
                        let bullet4 = ""
                        let bullet1 = ""
                        let bullet2 = ""
                        //console.log(p.blank.blank.bulletPoints)
                        for(let bl of p.blank.blank.bulletPoints){
                            //console.log(bl.title, "title")
                            if(bl.title.toLowerCase() == "fabric"){
                                bullet1 += ` ${bl.description}`
                            }
                            if(bl.title.toLowerCase() == "fit"){
                                bullet4 += ` ${bl.description}`
                            }
                            if(bl.title.toLowerCase() == "care instructions"){
                                bullet2 += ` ${bl.description}`
                            }
                            if(bl.title == "material" || bl.title.toLowerCase() == "Apparel Material"){
                                material = bl.description
                            }
                            if(bl.title == "material_1"){
                                material_1 = bl.description
                            }
                            if(bl.title == "material_percentage_1"){
                                material_percentage_1 = bl.description
                            }
                            if(bl.title == "material_2" ){
                                material_2 = bl.description
                            }
                            if(bl.title == "material_percentage_2"){
                                material_percentage_2 = bl.description
                            }
                            if(bl.title == "textile_dry_recommendation" || bl.title.toLowerCase() == "Garment Dry Recommendation"){
                                textile_dry_recommendation = bl.description
                            }
                            if(bl.title == "textile_wash_recommendation" || bl.title.toLowerCase() == "Garment Wash Recommendation"){
                                textile_wash_recommendation = bl.description
                            }
                            if(bl.title == "garment_fit" || bl.title.toLowerCase() == "Garment Fit"){
                                garment_fit = bl.description
                            }
                        }
                        
                        if(p.variants.length > 0 && p.variants[0].sku){
                            let product = await getSkuAcenda({...credentials, sku: `${p.design.sku}_${p.blank.blank.code}` })
                            let item = await getSkuAcenda({...credentials, sku: p.variants[0].sku })
                            if(item && item[0] && item[0].group_skus && !product){
                                product = await getSkuAcenda({...credentials, sku: item[0].group_skus[0] })
                            }
                            products.push(createTargetProduct({product, p, material, material_1, material_percentage_1, material_2, material_percentage_2, textile_dry_recommendation, textile_wash_recommendation,  bullet1, bullet2, bullet4, garment_fit}))
                            let inventory = []
                            for(let v of p.variants){
                                if(v.gtin){
                                    let item = await getSkuAcenda({...credentials, sku: v.sku })
                                    inventory.push({
                                        quantity: 1000,
                                        sku: v.sku,
                                        tracking: "basic",
                                        warehouse_id: 1
                                    })
                                    let price = p.design.printType == "EMB"? parseFloat(v.size.retailPrice) + 4: p.design.printType == "VIN"? parseFloat(v.size.retailPrice) + 4: v.size.retailPrice
                                    //console.log(price, "price")
                                    if(Object.keys(p.design.images).length > 1) price+= 2
                                    //console.log(price)
                                    if(p.design.licenseHolder) price = Math.round(price + price * .1) - .01
                                    if(v.size == "2XL") price = price -2
                                    // console.log(price)
                                    let bImages = []
                                    if(p.design.overrideImages && v.color && p.design.overrideImages[p.blank.blank._id] && p.design.overrideImages[p.blank.blank._id][v.color._id] && p.design.overrideImages[p.blank.blank._id][v.color._id].length > 0) bImages = p.design.overrideImages[p.blank.blank._id][v.color._id]
                                    else{
                                        for(let side of Object.keys(p.design.images)){
                                            //console.log(p.blank.defaultImages, "default images")
                                            let defaults = p.blank.defaultImages?.filter(im=> im.color == v.color._id.toString() && im.side == side)
                                            if(defaults?.length > 0){
                                                let sideImages =p.blank.blank.multiImages[side].filter(i=> i._id.toString() == defaults[0].id.toString()).map(im=>{
                                                    return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
                                                })
                                                for(let im of sideImages){
                                                    if(!bImages.includes(im)) bImages.push(im)
                                                }
                                            }
                                        }
                                        for(let side of Object.keys(p.design.images)){
                                            if(p.design.images[side] != undefined){
                                            // console.log(side, p.design.images[side], v.color._id.toString(), p.design.imageGroup)
                                                let sideImages = p.blank.blank.multiImages[side].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes(p.design.imageGroup))
                                                //console.log(sideImages.length, "sideImages imageGroup")
                                                if(side == "front" || side == "back"){
                                                    let modelImages = p.blank.blank.multiImages[side == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes(p.design.imageGroup))
                                                    if(modelImages.length > 0){
                                                        let images = modelImages.map(im=>{
                                                            return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
                                                        })
                                                        //console.log(images)
                                                        for(let im of images){
                                                            if(!bImages.includes(im)) bImages.push(im)
                                                        }
                                                    }
                                                }
                                                if(sideImages.length > 0){
                                                    let images = sideImages.map(im=>{
                                                        return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
                                                    })
                                                    //console.log(images)
                                                    for(let im of images){
                                                        if(!bImages.includes(im)) bImages.push(im)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if(bImages.length < 6 && p.design.imageGroup != "default"){
                                        for(let side of Object.keys(p.design.images)){
                                            if(p.design.images[side] != undefined){
                                                let sideImages = p.blank.blank.multiImages[side].filter(i=> i.color.toString() == v.color._id.toString() &&  i.imageGroup.includes("default"))
                                                //console.log(sideImages.length, "sideImages default")
                                                if(side == "front" || side == "back"){
                                                    let modelImages = p.blank.blank.multiImages[side == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes("default"))
                                                    if(modelImages.length > 0){
                                                        let images = modelImages.map(im=>{
                                                            return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
                                                        })
                                                        for(let im of images){
                                                            if(!bImages.includes(im)) bImages.push(im)
                                                        }
                                                    }
                                                }
                                                if(sideImages.length > 0){
                                                    let images = sideImages.map(im=>{
                                                        return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
                                                    })
                                                    //console.log(images)
                                                    for(let im of images){
                                                        if(!bImages.includes(im)) bImages.push(im)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if(bImages.length < 6){
                                        for(let side of Object.keys(p.design.images)){
                                            if(p.design.images[side] != undefined){
                                                let sideImages = p.blank.blank.multiImages[side].filter(i=> i.color.toString() == v.color._id.toString())
                                                //console.log(sideImages.length, "sideImages color")
                                                if(side == "front" || side == "back"){
                                                    let modelImages = p.blank.blank.multiImages[side == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString())
                                                    if(modelImages.length > 0){
                                                        let images = modelImages.map(im=>{
                                                            return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
                                                        })
                                                        //console.log(images)
                                                        for(let im of images){
                                                            if(!bImages.includes(im)) bImages.push(im)
                                                        }
                                                    }
                                                }
                                                if(sideImages.length > 0){
                                                    let images = sideImages.map(im=>{
                                                        return `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
                                                    })
                                                    //console.log(images)
                                                    for(let im of images){
                                                        if(!bImages.includes(im)) bImages.push(im)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    //console.log(bImages, "bImages")
                                    products.push(createTargetVariant({p,item,v, price, bImages, material, material_1, material_percentage_1, material_2, material_percentage_2, textile_dry_recommendation, textile_wash_recommendation, bullet1, bullet2, bullet4, garment_fit}) )
                                }
                            }
                            await addInventoryAcenda({...credentials, inventory})
                        }
                    }
                // console.log(targetHeader)
                    const csvStringifier = createCsvStringifier({
                        header: targetHeader,
                    });
                    //console.log(products)
                    //console.log("product", products.length)
                    let csvString =  await csvStringifier.stringifyRecords([...products])
                    csvString = `
                        ${csvStringifier.getHeaderString()}${csvString}
                    `
                    let url = `csv/${b}/${m}/${Date.now()}.csv`
                    let params = {
                        Bucket: "images1.pythiastechnologies.com",
                        Key: url,
                        Body: csvString.toString("base64"),
                        ACL: "public-read",
                        ContentEncoding: "base64",
                        ContentDisposition: "inline",
                        ContentType: "text/csv",
                        };
                    const data = await s3.send(new PutObjectCommand(params));
                    //console.log(csvStringifier.getHeaderString());
                    await update(csvupdate, url, b, m)
                }
                // if(m.toLowerCase() == "walmart"){
                //     console.log("walmart")
                //     let items = []
                //     //make items
                //     brands[b][m].map(p=>{
                //         for(let v of p.variants){
                //             let price = p.design.printType == "EMB"? parseFloat(v.size.retailPrice) + 4: p.design.printType == "VIN"? parseFloat(v.size.retailPrice) + 4: v.size.retailPrice
                //             //console.log(price, "price")
                //             if(Object.keys(p.design.images).length > 1) price+= 2
                //             //console.log(price)
                //             if(p.design.licenseHolder) price = Math.round(price + price * .1) - .01
                //             let bImages = []
                //                 Object.keys(p.blank.blank.multiImages).map(bmi=>{
                //                     let useImages = p.blank.blank.multiImages[bmi].filter(i=> i.imageGroup == p.design.imageGroup && i.color.toString() == v.color._id.toString())
                //                     //console.log(useImages)
                //                     for(let im of useImages){
                //                         console.log(`https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blank=${im.image}&colorName=${v.color.name}&design=${p.design.images[bmi]}&side=${bmi}`)
                //                         bImages.push(`https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blank=${im.image}&colorName=${v.color.name}&design=${p.design.images[bmi]}&side=${bmi}`)
                //                     }
                //                 })
                //             let item = {
                //                 mart: "WALMART_US",
                //                 sellingChannel: "online",
                //                 sku: v.sku,
                //                 upc: v.upc,
                //                 gtin: v.gtin,
                //                 productName: p.name,
                //                 shelf: ["Home page", "clothing",`${p.blank.blank.department} clothing`],
                //                 productType: p.blank.blank.category,
                //                 publishedStatus: "PUBLISHED",
                //                 price: {currency: "USD", amount: price},
                //                 variantGroupId: `${p.design.sku}_${p.blank.blank.code}`,
                //                 image_url: bImages[0],
                //                 variantGroupInfo: {
                //                     isPrimary: v.size.name == "L" && v.color._id == p.blank.primaryColor? true: false,
                //                     groupingAttributes: [
                //                         {name: "actual_color", value: v.color.name},
                //                         {name: "clothing_size", value: v.size.name}
                //                     ]
                //                 }
                //             }
                //             items.push(item)
                //         }
                //     })
                //     //uploadFeed
                //     console.log(items, "items")
                //     let res = await bulkUploadWalmart({clientId: process.env.walmartClientIdSS, clientSecret: process.env.walmartClientSecretSS, partnerId: process.env.walmartPartnerId, type: "MP_ITEM", file: {items}})
                //     console.log(res, "feedId")
                // }
            })
        })
    }catch(e){
        console.log(csvupdate, "update", e)
        let csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
        csvUpdate.active= false
        csvUpdate.error = true
        csvUpdate = await csvUpdate.save()
    }
}