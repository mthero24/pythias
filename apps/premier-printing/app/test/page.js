import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
import Item from "@/models/Items";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import Order from "@/models/Order";
import skus from "./rest.json";
import t2n from "./t2n.json";
import fs from "fs"
import axios from "axios"
import btoa from "btoa"
import {getOrderKohls, NextGTIN, CreateUpdateUPC, getTokenAcenda, getTokenWalmart} from "@pythias/integrations"
import {pullOrders} from "@/functions/pullOrders";
import { Style } from "@mui/icons-material";
import { createUpc } from "@/functions/createUpcs"
const doUPC = async ({design})=>{
    let soemthing = await createUpc({design})
    return soemthing
}
export default async function Test(){
    let token = await getTokenWalmart({clientId: process.env.walmartClientIdSS, clientSecret: process.env.walmartClientSecretSS, partnerId: process.env.walmartPartnerId})
    console.log(token)
    //let res = await axios.get(`https://api.gs1us.org/api/v1/myproduct/${g}`, headers).catch(e=> console.log(e.response?.data))
    // let designs = await Design.find({published: true}).populate("brands b2m blanks.blank blanks.colors blanks.defaultColor").sort({'_id': -1}).limit(600)
    // let brands = {}
    // let variants = {}
    // let bl = 0
    // console.log(designs.length)
    // for(let design of designs){
    //     //console.log(design.blanks.length)
    //     if(design.blanks.length > 0){
    //         for(let brand of design.brands){
    //            // console.log(brand)
    //             //console.log(design.b2m.filter(b2m=> b2m.brand == brand.name)[0])
    //             let b2m = design.b2m.filter(b2m=> b2m.brand == brand.name)[0]
    //             if(b2m){
    //                 console.log(b2m)
    //                 if(!brands[brand.name]) brands[brand.name] = {}
    //                 for(let m of b2m.marketPlaces){
    //                     let marketplace = m
    //                     if(m == "Shien") marketplace = "Shein"
    //                     if(m == "shopify") marketplace = "Shopify"
    //                     if(m == "amazon") marketplace = "Amazon"
    //                     if(!brands[brand.name][marketplace]) brands[brand.name][marketplace] = []
    //                     console.log(brands[brand.name][marketplace].length)
    //                 }
    //                 for(let b of design.blanks){
    //                     //console.log(`${brand.name} ${design.name} ${b.blank.name}`, brand.name, `${design.description} ${b.blank.description}`)
    //                     let variants = []
    //                      for(let c of b.colors){
    //                         for(let s of b.blank.sizes){
    //                             let upc = await SkuToUpc.findOne({design: design._id, blank: b.blank._id, color: c._id, size: s.name})
    //                             if(!upc) {
    //                                 await doUPC({design})
    //                                 upc = await SkuToUpc.findOne({design: design._id, blank: b.blank._id, color: c._id, size: s.name})
    //                             }
                                
    //                             let v = {
    //                                 upc: upc?.upc,
    //                                 sku: upc?.sku,
    //                                 gtin: upc?.gtin,
    //                                 size: s,
    //                                 color: c
    //                             }
    //                             variants.push(v)
    //                         }
    //                     }
    //                     let product = {
    //                         name: `${brand.name} ${design.name} ${b.blank.name}`,
    //                         brand: brand.name,
    //                         design: design,
    //                         blank: b,
    //                         options: ["color", "size"],
    //                         variants: variants

                            
    //                     }
    //                     for(let m of b2m.marketPlaces){
    //                         let marketplace = m
    //                         if(m == "Shien") marketplace = "Shein"
    //                         if(m == "shopify") marketplace = "Shopify"
    //                         if(m == "amazon") marketplace = "Amazon"
    //                         brands[brand.name][marketplace].push(product)
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }
    // //console.log(brands)
    // Object.keys(brands).map(b=>{
    //    Object.keys(brands[b]).map(async m=>{
    //         console.log(b, m, brands[b][m].length)
    //         if(m.toLowerCase() == "target"){
    //             console.log("make a target product csv")
    //             let header = [
    //                 {id: "name", Title: "name"},
    //                 {id: "brand", Title: "brand"},
    //                 {id: "description", Title: "description"},
    //                 {id: "options", Title: "options"},
    //                 {id: "material", Title: "material"},
    //                 {id: "pattern", Title: "pattern"},
    //                 {id: "bullet_1", Title: "bullet_1"},
    //                 {id: "bullet_2", Title: "bullet_2"},
    //                 {id: "bullet_3", Title: "bullet_3"},
    //                 {id: "bullet_4", Title: "bullet_4"},
    //                 {id: "fabric_weight_type", Title: "fabric_weight_type"},
    //                 {id: "garment_construction_details", Title: "garment_construction_details"},
    //                 {id: "gender", Title: "gender"},
    //                 {id: "pattern_group", Title: "pattern_group"},
    //                 {id: "size_grouping", Title: "size_grouping"},
    //                 {id: "targeted_audience", Title: "targeted_audience"},
    //                 {id: "textile_dry_recommendation", Title: "textile_dry_recommendation"},
    //                 {id: "textile_wash_recommendation", Title: "textile_wash_recommendation"},
    //                 {id: "garment_fit", Title: "garment_fit"},
    //                 {id: "garment_closure_type_tops", Title: "garment_closure_type_tops"},
    //                 {id: "garment_neckline_type", Title: "garment_neckline_type"},
    //                 {id: "garment_sleeve_length_type", Title: "garment_sleeve_length_type"},
    //                 {id: "garment_sleeve_style", Title: "garment_sleeve_style"},
    //                 {id: "garment_torso_length", Title: "garment_torso_length"},
    //                 {id: "item_style", Title: "item_style"},
    //                 {id: "target_posting_template", Title: "target_posting_template"},
    //                 {id: "target_listing_action", Title: "target_listing_action"},
    //                 {id: "import_description", Title: "import_description"},
    //                 {id: "prop_65", Title: "prop_65"},
    //                 {id: "tax", Title: "tax"},
    //                 {id: "apparel_material_1", Title: "apparel_material_1"},
    //                 {id: "garment_collar_type", Title: "garment_collar_type"},
    //                 {id: "apparel_and_accessories_subtype", Title: "apparel_and_accessories_subtype"},
    //                 {id: "season", Title: "season"},
    //                 {id: "textile_construction", Title: "textile_construction"},
    //             ]
    //             let products = brands[b][m].map(p=>{
    //                 let material = ""
    //                 let bullet4 = ""
    //                 let bullet1 = ""
    //                 let bullet2 = ""
    //                 for(let bl of p.blank.blank.bulletPoints){
    //                     if(bl.title == "fabric"){
    //                         material += ` ${bl.description}`
    //                         bullet4 += ` ${bl.description}`
    //                     }
    //                     if(bl.title == "fit"){
    //                         bullet1 += ` ${bl.description}`
    //                     }
    //                     if(bl.title == "Care Instructions"){
    //                         bullet2 += ` ${bl.description}`
    //                     }
    //                 }
    //                 return {
    //                     name: p.name,
    //                     brand: p.brand,
    //                     description: `${p.design.description} ${p.blank.blank.description}`,
    //                     options: '["size", "color"]',
    //                     material: material,
    //                     pattern: "Solid",
    //                     bullet_1: bullet1,
    //                     bullet_2: bullet2,
    //                     bullet_3: "Great to pair with any casual outfit.",
    //                     bullet_4: bullet4,
    //                     fabric_weight_type: "",
    //                     garment_construction_details: "",
    //                     gender: p.blank.blank.department == "Womens"? "Womens": "uni-sex",
    //                     pattern_group: "Solid",
    //                     size_grouping: p.blank.blank.department,
    //                     targeted_audience: p.blank.blank.department.toLowerCase() == "kids"? "kids (0-18)": "Adult (18 Years and Up)",
    //                     textile_dry_recommendation: bullet2,
    //                     "textile_wash_recommendation": bullet2,
    //                     garment_fit: bullet1,
    //                     garment_closure_type_tops: "Pull Over",
    //                     garment_neckline_type: p.blank.blank.neckline? p.blank.blank.neckline: "Crew",
    //                     garment_sleeve_length_type: p.blank.blank.sleeves? p.blank.blank.sleeves: "Short Sleeve",
    //                     garment_sleeve_style: p.blank.blank.sleeveStyle? p.blank.blank.sleeveStyle: "Basic Sleeve",
    //                     garment_torso_length: p.blank.blank.torsoLength? p.blank.blank.torsoLength: "To Waist",
    //                     item_style: p.blank.name,
    //                     target_posting_template: p.blank.blank.postingTemplate? p.blank.blank.postingTemplate: "Shirts New",
    //                     target_listing_action: "Full",
    //                     import_description: "made in the USA and imported",
    //                     prop_65: "No",
    //                     garment_collar_type: p.blank.blank.collar? p.blank.blank.collar: "No Collar",
    //                     tax: "General Clothing",
    //                     apparel_material_1: material,
    //                     apparel_and_accessories_subtype: p.blank.category,
    //                     textile_construction: p.blank.blank.construction? p.blank.blank.construction:"Woven"
    //                 }
    //             })
    //             const csvWriter = createCsvWriter({
    //                 path: `./${b}-${m}.csv`,
    //                 header,
    //             });
    //             await csvWriter.writeRecords(products)
    //             console.log("product", products.length, products[0])
    //             console.log("make a target variant csv")
    //             let header2 = [
    //                 {id: "variant.product_id", Title: "variant.product_id"},
    //                 {id: "variant.name", Title: "variant.name"},
    //                 {id: "variant.description", Title: "variant.description"},
    //                 {id: "variant.sku", Title: "variant.sku"},
    //                 {id: "variant.barcode", Title: "variant.barcode"},
    //                 {id: "variant.price", Title: "variant.price"},
    //                 {id: "variant.comp", Title: "variant.comp"},
    //                 {id: "variant.position", Title: "variant.position"},
    //                 {id: "variant.images", Title: "variant.images"},
    //                 {id: "variant.inventory", Title: "variant.inventory"},
    //                 {id: "variant.package_width", Title: "variant.package_width"},
    //                 {id: "variant.package_height", Title: "variant.package_height"},
    //                 {id: "variant.package_length", Title: "variant.package_length"},
    //                 {id: "variant.package_weight", Title: "variant.package_weight"},
    //                 {id: "variant.pattern", Title: "variant.pattern"},
    //                 {id: "variant.color_family", Title: "variant.color_family"},
    //                 {id: "variant.color", Title: "variant.color"},
    //                 {id: "variant.gender", Title: "variant.gender"},
    //                 {id: "variant.size", Title: "variant.size"},
    //             ]
    //             const csvWriter2 = createCsvWriter({
    //                 path: `./${b}-${m}-variants.csv`,
    //                 header: header2,
    //             });
    //             for(let p of brands[b][m]){
    //                 //console.log(p)
    //                 if(p.variants){
    //                     let variants = []
    //                     for(let v of p.variants){
    //                         //console.log(v.size.retailPrice, "size price")
    //                         let price = p.design.printType == "EMB"? parseFloat(v.size.retailPrice) + 4: p.design.printType == "VIN"? parseFloat(v.size.retailPrice) + 4: v.size.retailPrice
    //                         //console.log(price, "price")
    //                         if(Object.keys(p.design.images).length > 1) price+= 2
    //                         //console.log(price)
    //                         if(p.design.licenseHolder) price = Math.round(price + price * .1) - .01
    //                        // console.log(price)
    //                         let bImages = []
    //                         Object.keys(p.blank.blank.multiImages).map(bmi=>{
    //                             let useImages = p.blank.blank.multiImages[bmi].filter(i=> i.imageGroup == p.design.imageGroup && i.color.toString() == v.color._id.toString())
    //                             console.log(useImages)
    //                             for(let im of useImages){
    //                                 console.log(`https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blank=${im.image}&colorName=${v.color.name}&design=${p.design.images[bmi]}&side=${bmi}`)
    //                                 bImages.push(`https://simplysage.pythiastechnologies.com/api/renderImages?blank=${p.blank.blank.code}&blank=${im.image}&colorName=${v.color.name}&design=${p.design.images[bmi]}&side=${bmi}`)
    //                             }
    //                         })
    //                         variants.push( {
    //                             "variant.product_id": "",
    //                             "variant.name": `${p.name} - ${v.size.name} - ${v.color.name}`,
    //                             "variant.description": `${p.design.description} - ${v.size.name} - ${v.color.name} ${p.blank.blank.description}`,
    //                             "variant.sku": v.sku,
    //                             "variant.barcode": v.upc,
    //                             "variant.price": price.toFixed(2),
    //                             "variant.comp": price.toFixed(2),
    //                             "variant.position": v.size.name == "XS" || v.size.name == "2T" || v.size.name == "NB"? 10: v.size.name == "S" || v.size.name == "3T" || v.size.name == "6M"? 20: v.size.name == "M" || v.size.name == "4T" || v.size.name == "12M"? 30: v.size.name == "L" || v.size.name == "5/6" || v.size.name == "18M"? 40: v.size.name == "XL" || v.size.name == "24M"? 50: v.size.name == "2XL"? 60: 10,
    //                             "variant.images": bImages.toString(),
    //                             "variant.inventory": 1000,
    //                             "variant.package_width": 9,
    //                             "variant.package_height": 1,
    //                             "variant.package_length": 13,
    //                             "variant.weight": v.size.weight? v.size.weight: 0.3,
    //                             "variant.pattern": "Solid",
    //                             "variant.color_family": v.color.name,
    //                             "variant.color": v.color.name,
    //                             "variant.gender":  p.blank.blank.department == "Womens"? "Womens": "uni-sex",
    //                             "variant.size": v.size.name
    //                         })
    //                     }
    //                     //console.log(variants, "variants")
    //                     //return variants
    //                     await csvWriter2.writeRecords(variants)
    //                 }
    //             }
    //         }
    //    })
    // })
    //await SkuToUpc.updateMany({recycle: true, blank: {$ne: null}}, {recycle: false})
    return <h1>test</h1>
}