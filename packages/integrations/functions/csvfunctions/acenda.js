// const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
// import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
// import { getSkuAcenda,addInventoryAcenda  } from "../acenda";
// const s3 = new S3Client({ credentials:{
//     accessKeyId:'XWHXU4FP7MT2V842ITN9',
//    secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
// }, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3

// const createTargetProduct = ({p, product})=>{
//     console.log(
//         "create product", `${p.design.sku}_${p.blank.blank.code}`
//     )
//     return {
//         "id": product && product[0]? product[0].id: null,
//         name: p.name,
//         brand: p.brand,
//         sku: `${p.design.sku}_${p.blank.blank.code}`,
//         description: `${p.design.description} ${p.blank.blank.description}`,
//         "fields.season_or_event_depiction": p.design.season,
//         "fields.season": p.design.season,
//         "options.0": 'size',
//         "options.1": 'color',
//         group: "product",
//         ...p.blank.blank.targetHeader
//     }
// }
// const createTargetVariant = ({p,item, v, price, bImages})=>{
//     console.log("make variant", v.sku)
//       let sizes = {
//         "xs": "X Small",
//         "s": "Small",
//         "m": "Medium",
//         "l": "Large",
//         "xl": "X Large",
//         "2xl": "XX Large",
//         "2t": "2T",
//         "3t": "3T",
//         "4t": "4T",
//         "5/6t": "5/6",
//         "5t": "5T",
//         "6m": "6 Months",
//         "12m": "12 Months",
//         "18m": "18 Months",
//         "24m": "24 Months",
//         "nb": "Newborn"
//     }
//     return {
//         "id": item && item[0]? item[0].id: null,
//         "name": `${p.name} - ${v.size.name} - ${v.color.name}`,
//         gtin: v.gtin,
//         "description": `${p.design.description} ${p.blank.blank.description}`,
//         brand: p.brand,
//         "sku": v.sku,
//         "variant.barcode": v.upc,
//         "variant.price": price.toFixed(2),
//         "pricing_item.price.amount": price.toFixed(2),
//         "variant.color_family": v.color.colorFamily,
//         "variant.color": v.color.name,
//         "variant.size": sizes[v.size.name.toLowerCase()]? sizes[v.size.name.toLowerCase()]: v.size.name,
//         "fields.product_size": sizes[v.size.name.toLowerCase()]? sizes[v.size.name.toLowerCase()]: v.size.name,
//         group: "variant",
//         "fields.season_or_event_depiction": p.design.season,
//         "fields.season": p.design.season,
//         "group_skus.0": `${p.design.sku}_${p.blank.blank.code}`,
//         "images.default.main.url": bImages[0],
//         "images.default.1.alternate.url": bImages[1],
//         "images.default.2.alternate.url": bImages[2],
//         "images.default.3.alternate.url": p.blank.blank.sizeGuide?.images? p.blank.blank.sizeGuide?.images[0]: null,
//         "images.default.4.alternate.url": p.blank.blank.sizeGuide?.images? p.blank.blank.sizeGuide?.images[1]: null,
//         "images.default.5.alternate.url": bImages[3],
//         "images.default.6.alternate.url": bImages[4],
//         "images.default.7.alternate.url": bImages[5],
//         ...p.blank.blank.targetHeader
//     }
// }

// let targetHeader = [
//     {"id": "id", "title": "id"},
//     {"id": "name", "title": "name"},
//     {"id": "brand", "title": "fields.brand"},
//     {"id": "sku", "title": "sku"},
//     {"id": "description", "title": "fields.description"},
//     {"id": "options.0", "title": "options.0"},
//     {"id": "options.1", "title": "options.1"},
//     {"id": "fields.apparel_material_1", "title": "fields.apparel_material_1"},
//     {"id": "fields.apparel_material_1_percentage", "title": "fields.apparel_material_1_percentage"},
//     {"id": "fields.apparel_material_2", "title": "fields.apparel_material_2"},
//     {"id": "fields.apparel_material_2_percentage", "title": "fields.apparel_material_2_percentage"},
//     {"id": "fields.pattern", "title": "fields.pattern"},
//     {"id": "fields.bullet_1", "title": "fields.bullet_1"},
//     {"id": "fields.bullet_2", "title": "fields.bullet_2"},
//     {"id": "fields.bullet_3", "title": "fields.bullet_3"},
//     {"id": "fields.bullet_4", "title": "fields.bullet_4"},
//     {"id": "fields.fabric_weight_type", "title": "fields.fabric_weight_type"},
//     {"id": "fields.garment_construction_details", "title": "fields.garment_construction_details"},
//     {"id": "fields.gender", "title": "fields.gender"},
//     {"id": "fields.pattern_group", "title": "fields.pattern_group"},
//     {"id": "fields.size_grouping", "title": "fields.size_grouping"},
//     {"id": "fields.targeted_audience", "title": "fields.targeted_audience"},
//     {"id": "fields.textile_dry_recommendation", "title": "fields.textile_dry_recommendation"},
//     {"id": "fields.textile_wash_recommendation", "title": "fields.textile_wash_recommendation"},
//     {"id": "fields.garment_fit", "title": "fields.garment_fit"},
//     {"id": "fields.garment_closure_type_tops", "title": "fields.garment_closure_type_tops"},
//     {"id": "fields.garment_neckline_type", "title": "fields.garment_neckline_type"},
//     {"id": "fields.garment_sleeve_length_type", "title": "fields.garment_sleeve_length_type"},
//     {"id": "fields.garment_sleeve_style", "title": "fields.garment_sleeve_style"},
//     {"id": "fields.garment_torso_length", "title": "fields.garment_torso_length"},
//     {"id": "fields.import_description", "title": "fields.import_description"},
//     {"id": "fields.prop_65", "title": "fields.prop_65"},
//     {"id": "fields.tax", "title": "fields.tax"},
//     {"id": "fields.subtype", "title": "fields.subtype"},
//     {"id": "fields.season_or_event_depiction", "title": "fields.season_or_event_depiction"},
//     {"id": "fields.season", "title": "fields.season"},
//     {"id": "fields.textile_construction", "title": "fields.textile_construction"},
//     {"id": "group", "title": "group"},
//     {"id": "variant.barcode", "title": "upc"},
//     {"id": "gtin", "title": "gtin"},
//     {"id": "variant.price", "title": "pricing_item.msrp.amount"},
//     {"id": "pricing_item.price.amount", "title": "pricing_item.price.amount"},
//     {"id": "fields.package_width.value", "title": "fields.package_width.value"},
//     {"id": "fields.package_height.value", "title": "fields.package_height.value"},
//     {"id": "fields.package_length.value", "title": "fields.package_length.value"},
//     {"id": "fields.package_weight.value", "title": "fields.package_weight.value"},
//     {"id": "fields.product_size", "title": "fields.product_size"},
//     {"id": "variant.color_family", "title": "fields.color_family"},
//     {"id": "variant.color", "title": "fields.color"},
//     {"id": "variant.size", "title": "fields.size"},
//     {"id": "group_skus.0", "title": "group_skus.0"},
//     {"id": "images.default.main.url", "title": "images.default.main.url"},
//     {"id": "images.default.1.alternate.url", "title": "images.default.1.alternate.url"},
//     {"id": "images.default.2.alternate.url", "title": "images.default.2.alternate.url"},
//     {"id": "images.default.3.alternate.url", "title": "images.default.3.alternate.url"},
//     {"id": "images.default.4.alternate.url", "title": "images.default.4.alternate.url"},
//     {"id": "images.default.5.alternate.url", "title": "images.default.5.alternate.url"},
//     {"id": "images.default.6.alternate.url", "title": "images.default.6.alternate.url"},
//     {"id": "images.default.7.alternate.url", "title": "images.default.7.alternate.url"},
// ]

// export async function createTargetCsv({prods, credentials, client, b, m}){
//     console.log("make a target product csv")        
//     let products = [] 
//     for(let p of prods){  
//         if(p.variants.length > 0 && p.variants[0].sku){
//             let product = await getSkuAcenda({...credentials, sku: `${p.design.sku}_${p.blank.blank.code}` })
//             let item = await getSkuAcenda({...credentials, sku: p.variants[0].sku })
//             if(item && item[0] && item[0].group_skus && !product){
//                 product = await getSkuAcenda({...credentials, sku: item[0].group_skus[0] })
//             }
//             products.push(createTargetProduct({product, p}))
//             let inventory = []
//             for(let v of p.variants){
//                 if(v.gtin){
//                     let item = await getSkuAcenda({...credentials, sku: v.sku })
//                     inventory.push({
//                         quantity: 1000,
//                         sku: v.sku,
//                         tracking: "basic",
//                         warehouse_id: 1
//                     })
//                     let price = p.design.printType == "EMB"? parseFloat(v.size.retailPrice) + 4: p.design.printType == "VIN"? parseFloat(v.size.retailPrice) + 4: v.size.retailPrice
//                     //if(Object.keys(p.design.images).length > 1) price+= 2
//                     if(p.design.licenseHolder) price = Math.round(price + price * .1) - .01
//                     let bImages = []
//                     if(p.design.overrideImages && v.color && p.design.overrideImages[p.blank.blank._id] && p.design.overrideImages[p.blank.blank._id][v.color._id] && p.design.overrideImages[p.blank.blank._id][v.color._id].length > 0) bImages = p.design.overrideImages[p.blank.blank._id][v.color._id]
//                     else{
//                         for(let size of Object.keys(p.design.images)){
//                             //console.log(p.blank.defaultImages, "default images")
//                             let defaults = p.blank.defaultImages?.filter(im=> im.color == v.color._id.toString() && im.size == size)
//                             if(defaults?.length > 0){
//                                 let sizeImages = p.blank.blank.multiImages[size].filter(i=> i._id.toString() == defaults[0]._id.toString()).map(im=>{
//                                     return  `https://${client}.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[size]}&size=${size}&width=2400`
//                                 })
//                                 for(let im of sizeImages){
//                                     if(!bImages.includes(im)) bImages.push(im)
//                                 }
//                             }
//                         }
//                         for(let size of Object.keys(p.design.images)){
//                             if(p.design.images[size] != undefined){
//                             // console.log(size, p.design.images[size], v.color._id.toString(), p.design.imageGroup)
//                                 let sizeImages = p.blank.blank.multiImages[size].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes(p.design.imageGroup))
//                                 //console.log(sizeImages.length, "sizeImages imageGroup")
//                                 if(size == "front" || size == "back"){
//                                     let modelImages = p.blank.blank.multiImages[size == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes(p.design.imageGroup))
//                                     if(modelImages.length > 0){
//                                         let images = modelImages.map(im=>{
//                                             return  `https://${client}.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[size]}&size=${size}&width=2400`
//                                         })
//                                         //console.log(images)
//                                         for(let im of images){
//                                             if(!bImages.includes(im)) bImages.push(im)
//                                         }
//                                     }
//                                 }
//                                 if(sizeImages.length > 0){
//                                     let images = sizeImages.map(im=>{
//                                         return  `https://${client}.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[size]}&size=${size}&width=2400`
//                                     })
//                                     //console.log(images)
//                                     for(let im of images){
//                                         if(!bImages.includes(im)) bImages.push(im)
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                     if(bImages.length < 6 && p.design.imageGroup != "default"){
//                         for(let size of Object.keys(p.design.images)){
//                             if(p.design.images[size] != undefined){
//                                 let sizeImages = p.blank.blank.multiImages[size].filter(i=> i.color.toString() == v.color._id.toString() &&  i.imageGroup.includes("default"))
//                                 //console.log(sizeImages.length, "sizeImages default")
//                                 if(size == "front" || size == "back"){
//                                     let modelImages = p.blank.blank.multiImages[size == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString() && i.imageGroup.includes("default"))
//                                     if(modelImages.length > 0){
//                                         let images = modelImages.map(im=>{
//                                             return  `https://${client}.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[size]}&size=${size}&width=2400`
//                                         })
//                                         for(let im of images){
//                                             if(!bImages.includes(im)) bImages.push(im)
//                                         }
//                                     }
//                                 }
//                                 if(sizeImages.length > 0){
//                                     let images = sizeImages.map(im=>{
//                                         return  `https://${client}.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[size]}&size=${size}&width=2400`
//                                     })
//                                     //console.log(images)
//                                     for(let im of images){
//                                         if(!bImages.includes(im)) bImages.push(im)
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                     if(bImages.length < 6){
//                         for(let size of Object.keys(p.design.images)){
//                             if(p.design.images[size] != undefined){
//                                 let sizeImages = p.blank.blank.multiImages[size].filter(i=> i.color.toString() == v.color._id.toString())
//                                 //console.log(sizeImages.length, "sizeImages color")
//                                 if(size == "front" || size == "back"){
//                                     let modelImages = p.blank.blank.multiImages[size == "front"? "modelFront":"modelBack" ].filter(i=> i.color.toString() == v.color._id.toString())
//                                     if(modelImages.length > 0){
//                                         let images = modelImages.map(im=>{
//                                             return  `https://${client}.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[size]}&size=${size}&width =2400`
//                                         })
//                                         //console.log(images)
//                                         for(let im of images){
//                                             if(!bImages.includes(im)) bImages.push(im)
//                                         }
//                                     }
//                                 }
//                                 if(sizeImages.length > 0){
//                                     let images = sizeImages.map(im=>{
//                                         return `https://${client}.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blankImage=${im.image}&colorName=${v.color.name}&design=${p.design.images[size]}&size=${size}&width=2400`
//                                     })
//                                     //console.log(images)
//                                     for(let im of images){
//                                         if(!bImages.includes(im)) bImages.push(im)
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                     //console.log(bImages, "bImages")
//                     products.push(createTargetVariant({p,item,v, price, bImages}) )
//                 }
//             }
//             await addInventoryAcenda({...credentials, inventory})
//         }
//     }
//     const csvStringifier = createCsvStringifier({
//         header: targetHeader,
//     });
//     //console.log(products)
//     //console.log("product", products.length)
//     let csvString =  await csvStringifier.stringifyRecords([...products])
//     csvString = `${csvStringifier.getHeaderString()}${csvString}`
//     let url = `csv/${b}/${m}/${Date.now()}.csv`
//     let params = {
//         Bucket: "images1.pythiastechnologies.com",
//         Key: url,
//         Body: csvString.toString("base64"),
//         ACL: "public-read",
//         ContentEncoding: "base64",
//         ContentDisposition: "inline",
//         ContentType: "text/csv",
//         };
//     const data = await s3.send(new PutObjectCommand(params));
//     return url
// }