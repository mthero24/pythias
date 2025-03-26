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
import { createUpc } from "@/functions/createUpcs";
export default async function Test(){
    //let res = await axios.get(`https://api.gs1us.org/api/v1/myproduct/${g}`, headers).catch(e=> console.log(e.response?.data))
    // let designs = await Design.find({published: true}).populate("blanks.blank blanks.colors blanks.defaultColor").sort({'_id': -1}).limit(400)
    // for(let design of designs){
    //     console.log(new Date(design._id.getTimestamp()))
    //     await createUpc({design})
    // }
    await SkuToUpc.updateMany({recycle: true, blank: {$ne: null}}, {recycle: false})
    return <h1>test</h1>
}