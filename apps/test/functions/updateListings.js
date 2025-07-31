// import SkuToUpc from "@/models/skuUpcConversion";
// import Design from "@/models/Design";
// import CSVUpdates from "@/models/CSVUpdates"
// import { createUpc } from "@/functions/createUpcs"
// import {createTargetCsv} from "@pythias/integrations";
// const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
// import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
// const s3 = new S3Client({ credentials:{
//     accessKeyId:'XWHXU4FP7MT2V842ITN9',
//    secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
// }, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3
// const createShopSimonVariant = ({p, v, price, bImages, material, material_1, material_percentage_1, material_2, material_percentage_2, garment_fit, textile_dry_recommendation,textile_wash_recommendation, bullet1, bullet2, bullet4, url})=>{
//     console.log("make variant", v.sku)
//       let sizes = {
//         xs: "X SMALL",
//         s: "SMALL",
//         m: "MEDIUM",
//         l: "LARGE",
//         xl: "X LARGE",
//         "2xl": "XX LARGE",
//         "2t": "2T",
//         "3t": "3T",
//         "4t": "4T",
//         "5/6t": "5T-6T",
//         "5t": "5T-6T",
//         "6m": "6 MONTHS",
//         "12m": "12 MONTHS",
//         "18m": "18 MONTHS",
//         "24m": "24 MONTHS",
//         "nb": "NEWBORN"
//     }
//     return {
//         "title": `${p.name} - ${v.size.name} - ${v.color.name}`,
//         variantId: v.gtin,
//         "model-number": v.gtin,
//         "description": `${p.design.description} ${p.blank.blank.description}`,
//         designer: p.brand,
//         "sku": v.sku,
//         "upc": v.upc,
//         "msrp": price.toFixed(2),
//         weight: v.size.weight,
//         "normalized-color": v.color.colorFamily,
//         "color": v.color.name,
//         "unisex-size": v.size.name,
//         "womens-special-size-type": sizes[v.size.name]? sizes[v.size.name]: v.size.name,
//         "womens-clothing-top-size": sizes[v.size.name]? sizes[v.size.name]: v.size.name,
//         "designer-size": sizes[v.size.name]? sizes[v.size.name]: v.size.name,
//         "seo-keywords": p.design.tags,
//         "occasion": p.design.season,
//         "product-url": `${url}/${p.design.name.replace(/ /g, "-")}-${p.blank.blank.name.replace(/ /g, "-")}`,
//         "group_skus.0": `${p.design.sku}_${p.blank.blank.code}`,
//         "image-link-1": bImages[0],
//         "image-link-2": bImages[1],
//         "image-link-3": bImages[2],
//         "image-link-4": p.blank.blank.sizeGuide?.images? p.blank.blank.sizeGuide?.images[0]: null,
//         "image-link-5": p.blank.blank.sizeGuide?.images? p.blank.blank.sizeGuide?.images[1]: null,
//         "image-link-6": bImages[3],
//         ...p.blank.blank.shopSimonHeader
//     }
// }
// const createKohlsVariant = ({p,v, bImages, material, feature_1, feature_2, feature_4, product_category, url})=>{
//     let sizes = {
//         xs: "X SMALL",
//         s: "SMALL",
//         m: "MEDIUM",
//         l: "LARGE",
//         xl: "X LARGE",
//         "2xl": "XX LARGE",
//         "2t": "2T",
//         "3t": "3T",
//         "4t": "4T",
//         "5/6t": "5T-6T",
//         "5t": "5T-6T",
//         "6m": "6 MONTHS",
//         "12m": "12 MONTHS",
//         "18m": "18 MONTHS",
//         "24m": "24 MONTHS",
//         "nb": "NEWBORN"
//     }
//     console.log("make variant kohls", v.sku)
//     let constants = {}
//     Object.keys(p.blank.blank.kohlsHeader).map(k=>{
//         if(k != "nrf_size") constants[k] = p.blank.blank.kohlsHeader[k]
//     })
//     let variant = {
//         "title": (`${p.design.name}`).substring(0,100),
//         "meta_description": `${p.design.description}`,
//         brand: p.brand,
//         style_number: v.sku,
//         style_description: `${p.brand}`,      
//         "upc_number": v.upc,
//         "color_family": v.color.colorFamily,
//         "display_color": v.color.name.toString().substring(0, 22),
//         "main_image": bImages[0],
//         "alt_image_1": bImages[1],
//         "alt_image_2": bImages[2],
//         "alt_image_3": p.blank.blank.sizeGuide?.images? p.blank.blank.sizeGuide?.images[0]: null,
//         price: v.size.retailPrice,
//         quantity: 1000,
//         seller_url: `${url}/${p.design.name.replace(/ /g, "-")}-${p.blank.blank.name.replace(/ /g, "-")}`,
//         ...constants
//     }
//     if(p.design.nrf_size){
//          variant[p.blank.nrf_size] = sizes[v.size?.name?.toLowerCase()]? sizes[v.size?.name?.toLowerCase()]: v.size?.name
//     }else variant[p.blank.blank.kohlsHeader["nrf_size"]] = sizes[v.size?.name?.toLowerCase()]? sizes[v.size?.name?.toLowerCase()]: v.size?.name
//     if(variant["feature_1"] && variant["feature_1"].toString().length > 250) variant["feature_1"] = variant["feature_1"].toString().substring(0, 250)
//     if(variant["feature_5"] && variant["feature_5"].toString().length > 250) variant["feature_5"] = variant["feature_5"].toString().substring(0, 250)
//     console.log(variant["feature_1"])
//     if(variant.product_category?.includes("{gender}")) {
//         if(p.design.gender) variant.product_category = variant.product_category.replace("{gender}", p.design.gender)
//         else variant.product_category = variant.product_category.replace("{gender}", "Girl")
//     }
//     return variant
// }

// let kohlsHeader = [
//     {id: "product_category", title: "product_category"},
//     {id: "upc_number", title: "upc_number"},
//     {id: "title", title: "title"},
//     {id: "brand", title: "brand"},
//     {id: "meta_description", title: "meta_description"},
//     {id: "style_number", title: "style_number"},
//     {id: "style_description", title: "style_description"},
//     {id: "display_color", title: "display_color"},
//     {id: "color_family", title: "color_family"},
//     {id: "main_image", title: "main_image"},
//     {id: "care", title: "care"},
//     {id: "alt_image_1", title: "alt_image_1"},
//     {id: "alt_image_2", title: "alt_image_2"},
//     {id: "alt_image_3", title: "alt_image_3"},
//     {id: "alt_image_4", title: "alt_image_4"},
//     {id: "feature_1", title: "feature_1"},
//     {id: "feature_2", title: "feature_2"},
//     {id: "feature_3", title: "feature_3"},
//     {id: "feature_4", title: "feature_4"},
//     {id: "feature_5", title: "feature_5"},
//     {id: "feature_6", title: "feature_6"},
//     {id: "fabric_material", title: "fabric_material"},
//     {id: "origin", title: "origin"},
//     {id: "choking_hazard", title: "choking_hazard"},
//     {id: "perishable_indicator", title: "perishable_indicator"},
//     {id: "containsPFAS", title: "containsPFAS"},
//     {id: "seller_url", title: "seller_url"},
//     {id: "prop_65", title: "prop_65"},
//     {id: "is_ltl_item", title: "is_ltl_item"},
//     {id: "Priority", title: "Priority"},
//     {id: "gender-5_14_1_99999_111_721", title: "gender-5_14_1_99999_111_721"},
//     {id: "consumer_material-5_14_1_99999_111_721", title: "consumer_material-5_14_1_99999_111_721"},
//     {id: "consumer_occasion-5_14_1_99999_111_721", title: "consumer_occasion-5_14_1_99999_111_721"},
//     {id: "consumer_silhouette-5_14_1_99999_111_721", title: "consumer_silhouette-5_14_1_99999_111_721"},
//     {id: "feature-5_14_1_99999_111_721", title: "feature-5_14_1_99999_111_721"},
//     {id: "persona_category-5_14_1_99999_111_721", title: "persona_category-5_14_1_99999_111_721"},
//     {id: "persona_group-5_14_1_99999_111_721", title: "persona_group-5_14_1_99999_111_721"},
//     {id: "persona_subject-5_14_1_99999_111_721", title: "persona_subject-5_14_1_99999_111_721"},
//     {id: "persona_theme-5_14_1_99999_111_721", title: "persona_theme-5_14_1_99999_111_721"},
//     {id: "age_category-5_14_1_99999_111_721", title: "age_category-5_14_1_99999_111_721"},
//     {id: "consumer_pattern-5_14_1_99999_111_721", title: "consumer_pattern-5_14_1_99999_111_721"},
//     {id: "nrf_size-5_14_1_99999_111_721", title: "nrf_size-5_14_1_99999_111_721"},
//     {id: "gender-5_14_1_99999_111_723", title: "gender-5_14_1_99999_111_723"},
//     {id: "consumer_material-5_14_1_99999_111_723", title: "consumer_material-5_14_1_99999_111_723"},
//     {id: "consumer_occasion-5_14_1_99999_111_723", title: "consumer_occasion-5_14_1_99999_111_723"},
//     {id: "consumer_silhouette-5_14_1_99999_111_723", title: "consumer_silhouette-5_14_1_99999_111_723"},
//     {id: "feature-5_14_1_99999_111_723", title: "feature-5_14_1_99999_111_723"},
//     {id: "persona_category-5_14_1_99999_111_723", title: "persona_category-5_14_1_99999_111_723"},
//     {id: "persona_group-5_14_1_99999_111_723", title: "persona_group-5_14_1_99999_111_723"},
//     {id: "persona_subject-5_14_1_99999_111_723", title: "persona_subject-5_14_1_99999_111_723"},
//     {id: "persona_theme-5_14_1_99999_111_723", title: "persona_theme-5_14_1_99999_111_723"},
//     {id: "age_category-5_14_1_99999_111_723", title: "age_category-5_14_1_99999_111_723"},
//     {id: "consumer_pattern-5_14_1_99999_111_723", title: "consumer_pattern-5_14_1_99999_111_723"},
//     {id: "nrf_size-5_14_1_99999_111_723", title: "nrf_size-5_14_1_99999_111_723"},
//     {id: "gender-5_14_1_99999_125_1035", title: "gender-5_14_1_99999_125_1035"},
//     {id: "consumer_material-5_14_1_99999_125_1035", title: "consumer_material-5_14_1_99999_125_1035"},
//     {id: "consumer_occasion-5_14_1_99999_125_1035", title: "consumer_occasion-5_14_1_99999_125_1035"},
//     {id: "consumer_silhouette-5_14_1_99999_125_1035", title: "consumer_silhouette-5_14_1_99999_125_1035"},
//     {id: "feature-5_14_1_99999_125_1035", title: "feature-5_14_1_99999_125_1035"},
//     {id: "persona_category-5_14_1_99999_125_1035", title: "persona_category-5_14_1_99999_125_1035"},
//     {id: "persona_group-5_14_1_99999_125_1035", title: "persona_group-5_14_1_99999_125_1035"},
//     {id: "persona_subject-5_14_1_99999_125_1035", title: "persona_subject-5_14_1_99999_125_1035"},
//     {id: "persona_theme-5_14_1_99999_125_1035", title: "persona_theme-5_14_1_99999_125_1035"},
//     {id: "recommended_usage-5_14_1_99999_125_1035", title: "recommended_usage-5_14_1_99999_125_1035"},
//     {id: "age_category-5_14_1_99999_125_1035", title: "age_category-5_14_1_99999_125_1035"},
//     {id: "consumer_pattern-5_14_1_99999_125_1035", title: "consumer_pattern-5_14_1_99999_125_1035"},
//     {id: "nrf_size-5_14_1_99999_125_1035", title: "nrf_size-5_14_1_99999_125_1035"},
//     {id: "nrf_size-5_6_3_1_125_1035", title: "nrf_size-5_6_3_1_125_1035"},
//     {id: "nrf_size-5_6_3_4_125_1035", title: "nrf_size-5_6_3_4_125_1035"},
//     {id: "nrf_size-5_6_2_99999_42_331", title: "nrf_size-5_6_2_99999_42_331"},
//     {id: "nrf_size-5_6_2_99999_86_647", title: "nrf_size-5_6_2_99999_86_647"},
//     {id: "nrf_size-5_6_3_4_42_331", title: "nrf_size-5_6_3_4_42_331"},
//     {id: "price", title: "price"},
//     {id: "quantity", title: "quantity"}
// ]
// let shopSimonHeader = [
//     {id: "category", title: "category"},
//     {id: "sku", title: "sku"},
//     {id: "title", title: "title"},
//     {id: "description", title: "description"},
//     {id: "designer", title: "designer"},
//     {id: "image-link-1", title: "image-link-1"},
//     {id: "image-link-2", title: "image-link-2"},
//     {id: "msrp", title: "msrp"},
//     {id: "weight", title: "weight"},
//     {id: "upc", title: "upc"},
//     {id: "handling-time", title: "handling-time"},
//     {id: "model-number", title: "model-number"},
//     {id: "color", title: "color"},
//     {id: "image-link-3", title: "image-link-3"},
//     {id: "image-link-4", title: "image-link-4"},
//     {id: "image-link-5", title: "image-link-5"},
//     {id: "image-link-6", title: "image-link-6"},
//     {id: "final-sale", title: "final-sale"},
//     {id: "product-condition", title: "product-condition"},
//     {id: "video-link-1", title: "video-link-1"},
//     {id: "video-link-2", title: "video-link-2"},
//     {id: "product-material", title: "product-material"},
//     {id: "country-of-origin", title: "country-of-origin"},
//     {id: "product-url", title: "product-url"},
//     {id: "package-height", title: "package-height"},
//     {id: "package-length", title: "package-length"},
//     {id: "package-width", title: "package-width"},
//     {id: "seo-keywords", title: "seo-keywords"},
//     {id: "best-sellers", title: "best-sellers"},
//     {id: "merchandising-priority", title: "merchandising-priority"},
//     {id: "promotion-id", title: "promotion-id"},
//     {id: "shopify_variant_id", title: "shopify_variant_id"},
//     {id: "designer-size", title: "designer-size"},
//     {id: "normalized-color", title: "normalized-color"},
//     {id: "handbag-size", title: "handbag-size"},
//     {id: "unisex-size", title: "unisex-size"},
//     {id: "womens-special-size-type", title: "womens-special-size-type"},
//     {id: "unisex-clothing-fit", title: "unisex-clothing-fit"},
//     {id: "item-pattern", title: "item-pattern"},
//     {id: "occasion", title: "occasion"},
//     {id: "womens-neckline", title: "womens-neckline"},
//     {id: "sleeve-length", title: "sleeve-length"},
//     {id: "womens-clothing-top-size", title: "womens-clothing-top-size"},
// ]
// const doUPC = async ({design, blank})=>{
//     let soemthing = await createUpc({design, blank})
//     return soemthing
// }
// const update = async(csvupdate, url, brand, marketplace )=>{
//     console.log(brand, marketplace)
//     let csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
//     if(!csvUpdate.files) csvUpdate.files={}
//     console.log(csvUpdate.files)
//     csvUpdate.files[`${brand}_${marketplace}`] = `https://images1.pythiastechnologies.com/${url}`
//     csvUpdate.dataParsed = true
//     csvUpdate.csvReady= true
//     csvUpdate.active = false
//     csvUpdate.markModified("files")
//     console.log(csvUpdate.files)
//     csvUpdate = await csvUpdate.save()
// }
// export async function updateListings(csvupdate, sendTo){
//     let csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
//     try{
//         let designs = await Design.find({published: true, sendToMarketplaces: true}).populate("brands b2m blanks.blank blanks.colors blanks.defaultColor").sort({'_id': -1}).limit(200)
//         let brands = {}
//         let i = 0
//         //console.log(designs.length, designs[0].blanks[0].blank.sizeGuide,)
//         for(let design of designs){
//             console.log(i, "designs finished")
//             csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
//             if(!csvUpdate.active) break
//             i++
//             //console.log(design.blanks.length)
//             if(design.blanks.length > 0){
//                 for(let brand of design.brands){
//                     // console.log(brand)
//                     //console.log(design.b2m.filter(b2m=> b2m.brand == brand.name)[0])
//                     let b2m = design.b2m.filter(b2m=> b2m.brand == brand.name)[0]
//                     if(b2m){
//                         //console.log(b2m)
//                         if(!brands[brand.name]) brands[brand.name] = {}
//                         for(let m of b2m.marketPlaces){
//                             let marketplace = m
//                             if(m == "Shien") marketplace = "Shein"
//                             if(m == "shopify") marketplace = "Shopify"
//                             if(m == "amazon") marketplace = "Amazon"
//                             if(!brands[brand.name][marketplace]) brands[brand.name][marketplace] = []
//                             //console.log(brands[brand.name][marketplace].length)
//                         }
//                         for(let b of design.blanks){
//                             //console.log(`${brand.name} ${design.name} ${b.blank.name}`, brand.name, `${design.description} ${b.blank.description}`)
//                             if(b.blank){
//                                 let variants = []
//                                 let skus = await SkuToUpc.find({design: design._id, blank: b.blank._id})
//                                 if(skus.length < (b.colors.length * b.blank.sizes.length)) await doUPC({design, blank: b.blank._id})
//                                 for(let c of b.colors){
//                                     for(let s of b.blank.sizes){
//                                         let upc = await SkuToUpc.findOne({sku: `${b.blank.code}_${c.name}_${s.name}_${design.sku}`})
//                                         if(!upc) upc = await SkuToUpc.findOne({design: design._id, blank: b.blank._id, color: c._id, size: s.name})
//                                         if(upc){
//                                             let v = {
//                                                 upc: upc?.upc,
//                                                 sku: upc?.sku,
//                                                 gtin: upc?.gtin,
//                                                 size: s,
//                                                 color: c
//                                             }
//                                             variants.push(v)
//                                         }
//                                     }
//                                 }
//                                 let product = {
//                                     name: `${brand.name} ${design.name} ${b.blank.name}`,
//                                     brand: brand.name,
//                                     design: design,
//                                     blank: b,
//                                     options: ["color", "size"],
//                                     variants: variants

                                    
//                                 }
//                                 for(let m of b2m.marketPlaces){
//                                     let marketplace = m
//                                     if(m == "Shien") marketplace = "Shein"
//                                     if(m == "shopify") marketplace = "Shopify"
//                                     if(m == "amazon") marketplace = "Amazon"
//                                     if(brand.name == "The Juniper Shop" && product.blank.blank.department.toLowerCase() == "kids"){
//                                         brands[brand.name][marketplace].push(product)
//                                     }else if(brand.name == "Simply Sage Market" && product.blank.blank.department.toLowerCase() != "kids"){
//                                         brands[brand.name][marketplace].push(product)
//                                     }else if(brand.name != "The Juniper Shop" && brand.name != "Simply Sage Market"){
//                                         brands[brand.name][marketplace].push(product)
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//         csvUpdate.infoGathered = true
//         csvUpdate = await csvUpdate.save()
//         Object.keys(brands).map(b=>{
//             Object.keys(brands[b]).map(async m=>{
//                 //console.log(b, m, brands[b][m].length)
//                 if(m.toLowerCase() == "kohl's" && sendTo.kohls == true){
//                     console.log("make a target product csv")
                    
//                     let products = [] 
//                     let j = 0
//                     for(let p of brands[b][m]){
//                         j++
//                         console.log(brands[b][m].length, j)
//                         let material 
//                         let textile_wash_recommendation
//                         let garment_fit
//                         let feature_4 = ""
//                         let feature_1 = ""
//                         let feature_2 = ""
//                         //console.log(p.blank.blank.bulletPoints)
//                         for(let bl of p.blank.blank.bulletPoints){
//                             //console.log(bl.title, "title")
//                             if(bl.title.toLowerCase() == "fabric"){
//                                 feature_1 += ` ${bl.description}`
//                             }
//                             if(bl.title.toLowerCase() == "fit"){
//                                 feature_4 += ` ${bl.description}`
//                             }
//                             if(bl.title.toLowerCase() == "care instructions"){
//                                 feature_2 += ` ${bl.description}`
//                             }
//                             if(bl.title == "material" || bl.title.toLowerCase() == "Apparel Material"){
//                                 material = bl.description
//                             }
//                         }
                        
//                         if(p.variants.length > 0 && p.variants[0].sku){
//                             for(let v of p.variants){
//                                 if(v.gtin){
//                                     let price = p.design.printType == "EMB"? parseFloat(v.size.retailPrice) + 4: p.design.printType == "VIN"? parseFloat(v.size.retailPrice) + 4: v.size.retailPrice
//                                     //console.log(price, "price")
//                                     //if(Object.keys(p.design.images).length > 1) price+= 2
//                                     //console.log(price)
//                                     if(p.design.licenseHolder) price = Math.round(price + price * .1) - .01
//                                     //if(v.size == "2XL") price = price -2
//                                     // console.log(price)
//                                     let bImages = []
//                                     if(p.design.overrideImages && v.color && p.design.overrideImages[p.blank.blank._id] && p.design.overrideImages[p.blank.blank._id][v.color._id] && p.design.overrideImages[p.blank.blank._id][v.color._id].length > 0) bImages = p.design.overrideImages[p.blank.blank._id][v.color._id]
//                                     else{
//                                         for(let side of Object.keys(p.design.images)){
//                                             //console.log(p.blank.defaultImages, "default images")
//                                             let defaults = p.blank.defaultImages?.filter(im=> im.color == v.color._id.toString() && im.side == side)
//                                             if(defaults?.length > 0){
//                                                 let sideImages =p.blank.blank.multiImages[side].filter(i=> i._id.toString() == defaults[0].id.toString()).map(im=>{
//                                                     return  `https://simplysage.pythiastechnologies.com/api/renderImages/${p.blank.blank.code}-${v.color.name}-${p.design.sku}-${side}.jpg?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                 })
//                                                 for(let im of sideImages){
//                                                     if(!bImages.includes(im)) bImages.push(im)
//                                                 }
//                                             }
//                                         }
//                                         for(let side of Object.keys(p.design.images)){
//                                             if(p.design.images[side] != undefined){
//                                             // console.log(side, p.design.images[side], v.color._id.toString(), p.design.imageGroup)
//                                                 let sideImages = p.blank.blank.multiImages[side].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes(p.design.imageGroup))
//                                                 //console.log(sideImages.length, "sideImages imageGroup")
//                                                 if(side == "front" || side == "back"){
//                                                     let modelImages = p.blank.blank.multiImages[side == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes(p.design.imageGroup))
//                                                     if(modelImages.length > 0){
//                                                         let images = modelImages.map(im=>{
//                                                             return  `https://simplysage.pythiastechnologies.com/api/renderImages/${p.blank.blank.code}-${v.color.name}-${p.design.sku}-${side}.jpg?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                         })
//                                                         //console.log(images)
//                                                         for(let im of images){
//                                                             if(!bImages.includes(im)) bImages.push(im)
//                                                         }
//                                                     }
//                                                 }
//                                                 if(sideImages.length > 0){
//                                                     let images = sideImages.map(im=>{
//                                                         return  `https://simplysage.pythiastechnologies.com/api/renderImages/${p.blank.blank.code}-${v.color.name}-${p.design.sku}-${side}.jpg?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                     })
//                                                     //console.log(images)
//                                                     for(let im of images){
//                                                         if(!bImages.includes(im)) bImages.push(im)
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                     }
//                                     if(bImages.length < 6 && p.design.imageGroup != "default"){
//                                         for(let side of Object.keys(p.design.images)){
//                                             if(p.design.images[side] != undefined){
//                                                 let sideImages = p.blank.blank.multiImages[side].filter(i=> i.color.toString() == v.color._id.toString() &&  i.imageGroup.includes("default"))
//                                                 //console.log(sideImages.length, "sideImages default")
//                                                 if(side == "front" || side == "back"){
//                                                     let modelImages = p.blank.blank.multiImages[side == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes("default"))
//                                                     if(modelImages.length > 0){
//                                                         let images = modelImages.map(im=>{
//                                                             return  `https://simplysage.pythiastechnologies.com/api/renderImages/${p.blank.blank.code}-${v.color.name}-${p.design.sku}-${side}.jpg?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                         })
//                                                         for(let im of images){
//                                                             if(!bImages.includes(im)) bImages.push(im)
//                                                         }
//                                                     }
//                                                 }
//                                                 if(sideImages.length > 0){
//                                                     let images = sideImages.map(im=>{
//                                                         return  `https://simplysage.pythiastechnologies.com/api/renderImages/${p.blank.blank.code}-${v.color.name}-${p.design.sku}-${side}.jpg?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                     })
//                                                     //console.log(images)
//                                                     for(let im of images){
//                                                         if(!bImages.includes(im)) bImages.push(im)
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                     }
//                                     if(bImages.length < 6){
//                                         for(let side of Object.keys(p.design.images)){
//                                             if(p.design.images[side] != undefined){
//                                                 let sideImages = p.blank.blank.multiImages[side].filter(i=> i.color.toString() == v.color._id.toString())
//                                                 //console.log(sideImages.length, "sideImages color")
//                                                 if(side == "front" || side == "back"){
//                                                     let modelImages = p.blank.blank.multiImages[side == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString())
//                                                     if(modelImages.length > 0){
//                                                         let images = modelImages.map(im=>{
//                                                             return  `https://simplysage.pythiastechnologies.com/api/renderImages/${p.blank.blank.code}-${v.color.name}-${p.design.sku}-${side}.jpg?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                         })
//                                                         //console.log(images)
//                                                         for(let im of images){
//                                                             if(!bImages.includes(im)) bImages.push(im)
//                                                         }
//                                                     }
//                                                 }
//                                                 if(sideImages.length > 0){
//                                                     let images = sideImages.map(im=>{
//                                                         return `https://simplysage.pythiastechnologies.com/api/renderImages/${p.blank.blank.code}-${v.color.name}-${p.design.sku}-${side}.jpg?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                     })
//                                                     //console.log(images)
//                                                     for(let im of images){
//                                                         if(!bImages.includes(im)) bImages.push(im)
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                     }
//                                     let product_category = p.blank.blank.kohlsHeader?.product_category
//                                     //console.log(bImages, "bImages")
//                                     products.push(createKohlsVariant({p,v, bImages, material, feature_1, feature_2, feature_4, garment_fit, product_category, url: `https://www.${b == "Simply Sage Market"? "simplysagemarket.com": "thejunipershop.com"}/products`}) )
//                                 }
//                             }
//                         }
//                     }
//                 // console.log(targetHeader)
//                     const csvStringifier = createCsvStringifier({
//                         header: kohlsHeader,
//                     });
//                     //console.log(products)
//                     //console.log("product", products.length)
//                     let csvString =  await csvStringifier.stringifyRecords([...products])
//                     csvString = `
//                         ${csvStringifier.getHeaderString()}${csvString}
//                     `
//                     let url = `csv/${b}/${m}/${Date.now()}.csv`
//                     let params = {
//                         Bucket: "images1.pythiastechnologies.com",
//                         Key: url,
//                         Body: csvString.toString("base64"),
//                         ACL: "public-read",
//                         ContentEncoding: "base64",
//                         ContentDisposition: "inline",
//                         ContentType: "text/csv",
//                         };
//                     const data = await s3.send(new PutObjectCommand(params));
//                     //console.log(csvStringifier.getHeaderString());
//                     await update(csvupdate, url, b, m)
//                 }
//                 if(m.toLowerCase() == "target" && sendTo.target == true){
//                     let credentials
//                     if(b == "Simply Sage Market"){
//                         credentials = {clientId: process.env.acendaClientIdSS, clientSecret: process.env.acendaClientSecretSS, organization: process.env.acendaOrganizationSS}
//                     }else if(b == "The Juniper Shop") {
//                         credentials = {clientId: process.env.acendaClientIdJS, clientSecret: process.env.acendaClientSecretJS, organization: process.env.acendaOrganizationJS}
//                     }
//                     let url = await createTargetCsv({prods: brands[b][m], credentials, client: "simplysage", b, m})
//                     await update(csvupdate, url, b, m)
//                 }
//                 if(m.toLowerCase() == "shop simon" && sendTo.shopSimon == true){
//                     console.log("make a shop simon product csv")
                    
//                     let products = [] 
//                     let j = 0
//                     for(let p of brands[b][m]){
//                         j++
//                         console.log(brands[b][m].length, j)
//                         let credentials
//                         let material 
//                         let material_1
//                         let material_percentage_1
//                         let material_2
//                         let material_percentage_2
//                         let textile_dry_recommendation 
//                         let textile_wash_recommendation
//                         let garment_fit
//                         let bullet4 = ""
//                         let bullet1 = ""
//                         let bullet2 = ""
//                         //console.log(p.blank.blank.bulletPoints)
//                         for(let bl of p.blank.blank.bulletPoints){
//                             //console.log(bl.title, "title")
//                             if(bl.title.toLowerCase() == "fabric"){
//                                 bullet1 += ` ${bl.description}`
//                             }
//                             if(bl.title.toLowerCase() == "fit"){
//                                 bullet4 += ` ${bl.description}`
//                             }
//                             if(bl.title.toLowerCase() == "care instructions"){
//                                 bullet2 += ` ${bl.description}`
//                             }
//                             if(bl.title == "material" || bl.title.toLowerCase() == "Apparel Material"){
//                                 material = bl.description
//                             }
//                             if(bl.title == "material_1"){
//                                 material_1 = bl.description
//                             }
//                             if(bl.title == "material_percentage_1"){
//                                 material_percentage_1 = bl.description
//                             }
//                             if(bl.title == "material_2" ){
//                                 material_2 = bl.description
//                             }
//                             if(bl.title == "material_percentage_2"){
//                                 material_percentage_2 = bl.description
//                             }
//                             if(bl.title == "textile_dry_recommendation" || bl.title.toLowerCase() == "Garment Dry Recommendation"){
//                                 textile_dry_recommendation = bl.description
//                             }
//                             if(bl.title == "textile_wash_recommendation" || bl.title.toLowerCase() == "Garment Wash Recommendation"){
//                                 textile_wash_recommendation = bl.description
//                             }
//                             if(bl.title == "garment_fit" || bl.title.toLowerCase() == "Garment Fit"){
//                                 garment_fit = bl.description
//                             }
//                         }
                        
//                         if(p.variants.length > 0 && p.variants[0].sku){
//                             for(let v of p.variants){
//                                 if(v.gtin){
//                                     let price = p.design.printType == "EMB"? parseFloat(v.size.retailPrice) + 4: p.design.printType == "VIN"? parseFloat(v.size.retailPrice) + 4: v.size.retailPrice
//                                     //console.log(price, "price")
//                                     //if(Object.keys(p.design.images).length > 1) price+= 2
//                                     //console.log(price)
//                                     if(p.design.licenseHolder) price = Math.round(price + price * .1) - .01
//                                     //if(v.size == "2XL") price = price -2
//                                     // console.log(price)
//                                     let bImages = []
//                                     if(p.design.overrideImages && v.color && p.design.overrideImages[p.blank.blank._id] && p.design.overrideImages[p.blank.blank._id][v.color._id] && p.design.overrideImages[p.blank.blank._id][v.color._id].length > 0) bImages = p.design.overrideImages[p.blank.blank._id][v.color._id]
//                                     else{
//                                         for(let side of Object.keys(p.design.images)){
//                                             //console.log(p.blank.defaultImages, "default images")
//                                             let defaults = p.blank.defaultImages?.filter(im=> im.color == v.color._id.toString() && im.side == side)
//                                             if(defaults?.length > 0){
//                                                 let sideImages =p.blank.blank.multiImages[side].filter(i=> i._id.toString() == defaults[0].id.toString()).map(im=>{
//                                                     return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                 })
//                                                 for(let im of sideImages){
//                                                     if(!bImages.includes(im)) bImages.push(im)
//                                                 }
//                                             }
//                                         }
//                                         for(let side of Object.keys(p.design.images)){
//                                             if(p.design.images[side] != undefined){
//                                             // console.log(side, p.design.images[side], v.color._id.toString(), p.design.imageGroup)
//                                                 let sideImages = p.blank.blank.multiImages[side].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes(p.design.imageGroup))
//                                                 //console.log(sideImages.length, "sideImages imageGroup")
//                                                 if(side == "front" || side == "back"){
//                                                     let modelImages = p.blank.blank.multiImages[side == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes(p.design.imageGroup))
//                                                     if(modelImages.length > 0){
//                                                         let images = modelImages.map(im=>{
//                                                             return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                         })
//                                                         //console.log(images)
//                                                         for(let im of images){
//                                                             if(!bImages.includes(im)) bImages.push(im)
//                                                         }
//                                                     }
//                                                 }
//                                                 if(sideImages.length > 0){
//                                                     let images = sideImages.map(im=>{
//                                                         return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                     })
//                                                     //console.log(images)
//                                                     for(let im of images){
//                                                         if(!bImages.includes(im)) bImages.push(im)
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                     }
//                                     if(bImages.length < 6 && p.design.imageGroup != "default"){
//                                         for(let side of Object.keys(p.design.images)){
//                                             if(p.design.images[side] != undefined){
//                                                 let sideImages = p.blank.blank.multiImages[side].filter(i=> i.color.toString() == v.color._id.toString() &&  i.imageGroup.includes("default"))
//                                                 //console.log(sideImages.length, "sideImages default")
//                                                 if(side == "front" || side == "back"){
//                                                     let modelImages = p.blank.blank.multiImages[side == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes("default"))
//                                                     if(modelImages.length > 0){
//                                                         let images = modelImages.map(im=>{
//                                                             return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                         })
//                                                         for(let im of images){
//                                                             if(!bImages.includes(im)) bImages.push(im)
//                                                         }
//                                                     }
//                                                 }
//                                                 if(sideImages.length > 0){
//                                                     let images = sideImages.map(im=>{
//                                                         return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                     })
//                                                     //console.log(images)
//                                                     for(let im of images){
//                                                         if(!bImages.includes(im)) bImages.push(im)
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                     }
//                                     if(bImages.length < 6){
//                                         for(let side of Object.keys(p.design.images)){
//                                             if(p.design.images[side] != undefined){
//                                                 let sideImages = p.blank.blank.multiImages[side].filter(i=> i.color.toString() == v.color._id.toString())
//                                                 //console.log(sideImages.length, "sideImages color")
//                                                 if(side == "front" || side == "back"){
//                                                     let modelImages = p.blank.blank.multiImages[side == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString())
//                                                     if(modelImages.length > 0){
//                                                         let images = modelImages.map(im=>{
//                                                             return  `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                         })
//                                                         //console.log(images)
//                                                         for(let im of images){
//                                                             if(!bImages.includes(im)) bImages.push(im)
//                                                         }
//                                                     }
//                                                 }
//                                                 if(sideImages.length > 0){
//                                                     let images = sideImages.map(im=>{
//                                                         return `https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[side]}&side=${side}&width=2400`
//                                                     })
//                                                     //console.log(images)
//                                                     for(let im of images){
//                                                         if(!bImages.includes(im)) bImages.push(im)
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                     }
//                                     //console.log(bImages, "bImages")
//                                     products.push(createShopSimonVariant({p, v, price, bImages, material, material_1, material_percentage_1, material_2, material_percentage_2, textile_dry_recommendation, textile_wash_recommendation, bullet1, bullet2, bullet4, garment_fit, url: `https://www.${b == "Simply Sage Market"? "simplysagemarket.com": "thejunipershop.com"}/products`}) )
//                                 }
//                             }
//                         }
//                     }
//                 // console.log(targetHeader)
//                     const csvStringifier = createCsvStringifier({
//                         header: shopSimonHeader,
//                     });
//                     //console.log(products)
//                     //console.log("product", products.length)
//                     let csvString =  await csvStringifier.stringifyRecords([...products])
//                     csvString = `
//                         ${csvStringifier.getHeaderString()}${csvString}
//                     `
//                     let url = `csv/${b}/${m}/${Date.now()}.csv`
//                     let params = {
//                         Bucket: "images1.pythiastechnologies.com",
//                         Key: url,
//                         Body: csvString.toString("base64"),
//                         ACL: "public-read",
//                         ContentEncoding: "base64",
//                         ContentDisposition: "inline",
//                         ContentType: "text/csv",
//                         };
//                     const data = await s3.send(new PutObjectCommand(params));
//                     //console.log(csvStringifier.getHeaderString());
//                     await update(csvupdate, url, b, m)
//                 }
//                 // if(m.toLowerCase() == "walmart"){
//                 //     console.log("walmart")
//                 //     let items = []
//                 //     //make items
//                 //     brands[b][m].map(p=>{
//                 //         for(let v of p.variants){
//                 //             let price = p.design.printType == "EMB"? parseFloat(v.size.retailPrice) + 4: p.design.printType == "VIN"? parseFloat(v.size.retailPrice) + 4: v.size.retailPrice
//                 //             //console.log(price, "price")
//                 //             if(Object.keys(p.design.images).length > 1) price+= 2
//                 //             //console.log(price)
//                 //             if(p.design.licenseHolder) price = Math.round(price + price * .1) - .01
//                 //             let bImages = []
//                 //                 Object.keys(p.blank.blank.multiImages).map(bmi=>{
//                 //                     let useImages = p.blank.blank.multiImages[bmi].filter(i=> i.imageGroup == p.design.imageGroup && i.color.toString() == v.color._id.toString())
//                 //                     //console.log(useImages)
//                 //                     for(let im of useImages){
//                 //                         console.log(`https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blank=${im.image}&colorName=${v.color.name}&design=${p.design.images[bmi]}&side=${bmi}`)
//                 //                         bImages.push(`https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blank=${im.image}&colorName=${v.color.name}&design=${p.design.images[bmi]}&side=${bmi}`)
//                 //                     }
//                 //                 })
//                 //             let item = {
//                 //                 mart: "WALMART_US",
//                 //                 sellingChannel: "online",
//                 //                 sku: v.sku,
//                 //                 upc: v.upc,
//                 //                 gtin: v.gtin,
//                 //                 productName: p.name,
//                 //                 shelf: ["Home page", "clothing",`${p.blank.blank.department} clothing`],
//                 //                 productType: p.blank.blank.category,
//                 //                 publishedStatus: "PUBLISHED",
//                 //                 price: {currency: "USD", amount: price},
//                 //                 variantGroupId: `${p.design.sku}_${p.blank.blank.code}`,
//                 //                 image_url: bImages[0],
//                 //                 variantGroupInfo: {
//                 //                     isPrimary: v.size.name == "L" && v.color._id == p.blank.primaryColor? true: false,
//                 //                     groupingAttributes: [
//                 //                         {name: "actual_color", value: v.color.name},
//                 //                         {name: "clothing_size", value: v.size.name}
//                 //                     ]
//                 //                 }
//                 //             }
//                 //             items.push(item)
//                 //         }
//                 //     })
//                 //     //uploadFeed
//                 //     console.log(items, "items")
//                 //     let res = await bulkUploadWalmart({clientId: process.env.walmartClientIdSS, clientSecret: process.env.walmartClientSecretSS, partnerId: process.env.walmartPartnerId, type: "MP_ITEM", file: {items}})
//                 //     console.log(res, "feedId")
//                 // }
//             })
//         })
//         for(let design of designs){
//             design.sendToMarketplaces = false
//             await design.save()
//         }
//     }catch(e){
//         console.log(csvupdate, "update", e)
//         let csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
//         csvUpdate.active= false
//         csvUpdate.error = true
//         csvUpdate = await csvUpdate.save()
//     }
// }