import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import {createObjectCsvWriter} from "csv-writer";
import Item from "@/models/Items";
import Blank from "@/models/Blanks";
import Color from "@/models/Color";
import Order from "@/models/Order";
import skus from "./rest.json";
import t2n from "./t2n.json";
import fs from "fs"
import axios from "axios"
import btoa from "btoa"
import {getOrderKohls, NextGTIN, CreateUpdateUPC} from "@pythias/integrations"
import {pullOrders} from "@/functions/pullOrders";
import { Style } from "@mui/icons-material";
import { createUpc } from "@/functions/createUpcs"
export default async function Test(){
    //let res = await axios.get(`https://api.gs1us.org/api/v1/myproduct/${g}`, headers).catch(e=> console.log(e.response?.data))
    let designs = await Design.find({published: true}).populate("brands b2m blanks.blank blanks.colors blanks.defaultColor").sort({'_id': -1}).limit(400)
    let brands = {}
    let variants = {}
    let bl = 0
    console.log(designs.length)
    for(let design of designs){
        //console.log(design.blanks.length)
        if(design.blanks.length > 0){
            for(let brand of design.brands){
               // console.log(brand)
                //console.log(design.b2m.filter(b2m=> b2m.brand == brand.name)[0])
                let b2m = design.b2m.filter(b2m=> b2m.brand == brand.name)[0]
                if(b2m){
                    console.log(b2m)
                    if(!brands[brand.name]) brands[brand.name] = {}
                    for(let m of b2m.marketPlaces){
                        let marketplace = m
                        if(m == "Shien") marketplace = "Shein"
                        if(m == "shopify") marketplace = "Shopify"
                        if(m == "amazon") marketplace = "Amazon"
                        if(!brands[brand.name][marketplace]) brands[brand.name][marketplace] = []
                        console.log(brands[brand.name][marketplace].length)
                    }
                    for(let b of design.blanks){
                        //console.log(`${brand.name} ${design.name} ${b.blank.name}`, brand.name, `${design.description} ${b.blank.description}`)
                        let variants = []
                         for(let c of b.colors){
                            for(let s of b.blank.sizes){
                                let upc = await SkuToUpc.findOne({design: design._id, blank: b.blank._id, color: c._id, size: s.name})
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
                            brands[brand.name][marketplace].push(product)
                        }
                    }
                }
            }
        }
    }
    //console.log(brands)
    Object.keys(brands).map(b=>{
       Object.keys(brands[b]).map(m=>{
            console.log(b, m, brands[b][m].length)
            if(m.toLowerCase() == "target"){
                console.log("make a target product csv")
                let header = [
                    {id: "name", Title: "name"},
                    {id: "brand", Title: "brand"},
                    {id: "description", Title: "description"},
                    {id: "options", Title: "options"},
                    {id: "material", Title: "material"},
                    {id: "pattern", Title: "pattern"},
                    {id: "bullet_1", Title: "bullet_1"},
                    {id: "bullet_2", Title: "bullet_2"},
                    {id: "bullet_3", Title: "bullet_3"},
                    {id: "bullet_4", Title: "bullet_4"},
                    {id: "fabric_weight_type", Title: "fabric_weight_type"},
                    {id: "garment_construction_details", Title: "garment_construction_details"},
                    {id: "gender", Title: "gender"},
                    {id: "pattern_group", Title: "pattern_group"},
                    {id: "size_grouping", Title: "size_grouping"},
                    {id: "targeted_audience", Title: "targeted_audience"},
                    {id: "textile_dry_recommendation", Title: "textile_dry_recommendation"},
                    {id: "textile_wash_recommendation", Title: "textile_wash_recommendation"},
                    {id: "garment_fit", Title: "garment_fit"},
                    {id: "garment_closure_type_tops", Title: "garment_closure_type_tops"},
                    {id: "garment_neckline_type", Title: "garment_neckline_type"},
                    {id: "garment_sleeve_length_type", Title: "garment_sleeve_length_type"},
                    {id: "garment_sleeve_style", Title: "garment_sleeve_style"},
                    {id: "garment_torso_length", Title: "garment_torso_length"},
                    {id: "item_style", Title: "item_style"},
                    {id: "target_posting_template", Title: "target_posting_template"},
                    {id: "target_listing_action", Title: "target_listing_action"},
                    {id: "import_description", Title: "import_description"},
                    {id: "prop_65", Title: "prop_65"},
                    {id: "tax", Title: "tax"},
                    {id: "apparel_material_1", Title: "apparel_material_1"},
                    {id: "garment_collar_type", Title: "garment_collar_type"},
                    {id: "apparel_and_accessories_subtype", Title: "apparel_and_accessories_subtype"},
                    {id: "season", Title: "season"},
                    {id: "textile_construction", Title: "textile_construction"},
                ]
                let products = brands[b][m].map(p=>{
                    let material = ""
                    let bullet4 = ""
                    let bullet1 = ""
                    let bullet2 = ""
                    for(let bl of p.blank.bulletPoints){
                        if(bl.title == "fabric"){
                            material += ` ${bl.description}`
                            bullet4 += ` ${bl.description}`
                        }
                        if(bl.title == "fit"){
                            bullet1 += ` ${bl.description}`
                        }
                        if(bl.title == "Care Instructions"){
                            bullet2 += ` ${bl.description}`
                        }
                    }
                    return {
                        name: p.name,
                        brand: p.brand,
                        description: `${p.design.description} ${p.blank.description}`,
                        options: ["size", "color"],
                        material: material,
                        pattern: "Solid",
                        bullet_1: bullet1,
                        bullet_2: bullet2,
                        bullet_3: "Great to pair with any casual outfit.",
                        bullet_4: bullet4,
                        fabric_weight_type: "",
                        garment_construction_details: "",
                        gender: p.blank.department == "Womens"? "Womens": "uni-sex",
                        pattern_group: "Solid",
                        size_grouping: p.blank.department,
                        targeted_audience: p.blank.department == "kids"? "kids (0-18)": "Adult (18 Years and Up)",
                        textile_dry_recommendation: bullet2,
                        "textile_wash_recommendation": bullet2,
                        garment_fit: bullet1,
                        garment_closure_type_tops: "Pull Over",
                        garment_neckline_type: p.blank.neckline? p.blank.neckline: "Crew",
                        garment_sleeve_length_type: p.blank.sleeves? p.blank.sleeves: "Short Sleeve",
                        garment_sleeve_style: p.blank.sleeveStyle? p.blank.sleeveStyle: "Basic Sleeve",
                        garment_torso_length: p.blank.torsoLength? p.Blank.torsoLength: "Basic Sleeve",
                        item_style: p.blank.name,
                        target_posting_template: p.blank.postingTemplate? p.blank.postingTemplate: "Shirts New",
                        target_listing_action: "Full",
                        import_description: "made in the USA and imported",
                        prop_65: "No",
                        garment_collar_type: p.blank.collar? p.blank.collar: "No Collar",
                        tax: "General Clothing",
                        apparel_material_1: material,
                        apparel_and_accessories_subtype: p.blank.category,
                        textile_construction: p.blank.construction? p.blank.construction:"Woven"
                    }
                })
                console.log("product", products.length, products[0])
                console.log("make a target variant csv")
            }
       })
    })
    //await SkuToUpc.updateMany({recycle: true, blank: {$ne: null}}, {recycle: false})
    return <h1>test</h1>
}