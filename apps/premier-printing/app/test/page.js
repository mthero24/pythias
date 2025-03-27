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
    let designs = await Design.find({published: true}).populate("brands b2m blanks.blank blanks.colors blanks.defaultColor").sort({'_id': -1})
    let brands = {}
    let bl = 0
    console.log(designs.length)
    for(let design of designs){
        //console.log(design.blanks.length)
        if(design.blanks.length > 0){
            for(let brand of design.brands){
               // console.log(brand)
                if(!brands[brand.name]) brands[brand.name] = []
                for(let b of design.blanks){
                    //console.log(`${brand.name} ${design.name} ${b.blank.name}`, brand.name, `${design.description} ${b.blank.description}`)
                    let product = {
                        name: `${brand.name} ${design.name} ${b.blank.name}`,
                        brand: brand.name,
                        description: `${design.description} ${b.blank.description}`,
                        options: ["color", "size"],
                        
                    }
                    brands[brand.name].push(product)
                    // for(let c of b.colors){
                    //     for(let s of b.blank.sizes){
                    //         console.log(design.sku, b.blank.code, c.name, s.name)
                    //         // name brand 
                    //     }
                    // }
                }
            }
        }
    }
    //console.log(brands)
    Object.keys(brands).map(b=>{
        console.log(brands[b].length, b)
    })
    //await SkuToUpc.updateMany({recycle: true, blank: {$ne: null}}, {recycle: false})
    return <h1>test</h1>
}