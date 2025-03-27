import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
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
    // let designs = await Design.find({published: true}).populate("brands b2m blanks.blank blanks.colors blanks.defaultColor").sort({'_id': -1})
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
    //                             let v = {
    //                                 upc: upc?.upc,
    //                                 sku: upc?.sku,
    //                                 gtin: upc?.gtin,
    //                                 size: s,
    //                                 color: c
    //                             }

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
    //    Object.keys(brands[b]).map(m=>{
    //         console.log(b, m, brands[b][m].length)
    //    })
    // })
    //await SkuToUpc.updateMany({recycle: true, blank: {$ne: null}}, {recycle: false})
    return <h1>test</h1>
}