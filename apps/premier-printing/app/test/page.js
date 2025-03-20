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
import {getOrderKohls} from "@pythias/integrations"
import {pullOrders} from "@/functions/pullOrders";
export default async function Test(){
    let skuToUpc = await SkuToUpc.find({}).limit(1)
    console.log(skuToUpc)
    let upc = skuToUpc[0]
    let sku2 = await SkuToUpc.find({design: upc.design, blank: upc.blank, size: upc.size, upc: upc.upc}).limit(1)
    return <h1>test</h1>
}