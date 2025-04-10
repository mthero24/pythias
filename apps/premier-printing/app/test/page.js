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
import {getOrderKohls, NextGTIN, CreateUpdateUPC, getTokenAcenda, getItemsWalmart, retireItemWalmart, getSpecWalmart, bulkUploadWalmart, getFeedWalmart, getWarehouseAcenda, getCatalogAcenda, getSkuAcenda} from "@pythias/integrations"
import {pullOrders} from "@/functions/pullOrders";
import { Style } from "@mui/icons-material";
import { createUpc } from "@/functions/createUpcs"
import {updateListings} from "@/functions/updateListings"
export default async function Test(){
    //await updateListings()
    await pullOrders()
    const removeOutOfStockItemsWalmart = async ()=>{
        let items = await getItemsWalmart({clientId: process.env.walmartClientIdSS, clientSecret: process.env.walmartClientSecretSS, partnerId: process.env.walmartPartnerId, params: [{limit: "300"}]})
        for(let item of items){
            console.log(item, item.variantGroupInfo,"retire item")
            await retireItemWalmart({clientId: process.env.walmartClientIdSS, clientSecret: process.env.walmartClientSecretSS, partnerId: process.env.walmartPartnerId, sku: item.sku})
        }
    }
    //await getSpecWalmart({clientId: process.env.walmartClientIdSS, clientSecret: process.env.walmartClientSecretSS, partnerId: process.env.walmartPartnerId,})
    //removeOutOfStockItemsWalmart()
    // let item = await getSkuAcenda({clientId: process.env.acendaClientIdSS, clientSecret: process.env.acendaClientSecretSS, organization: process.env.acendaOrganizationSS, sku: "LGDSET_Espresso_L_3383B_F" })
    // if(item[0]){
    //     console.log(item[0])
    // }
    //let res = await axios.get(`https://api.gs1us.org/api/v1/myproduct/${g}`, headers).catch(e=> console.log(e.response?.data))
   
    //await SkuToUpc.updateMany({recycle: true, blank: {$ne: null}}, {recycle: false})
    return <h1>test</h1>
}