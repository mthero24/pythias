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
import {pullOrders} from "@/functions/pullOrders";
import { getOrders, generatePieceID } from "@pythias/integrations";
import { Style } from "@mui/icons-material";
import { createUpc } from "@/functions/createUpcs"
import {updateListings} from "@/functions/updateListings"
import {getOrderKohls, NextGTIN, CreateUpdateUPC, getTokenAcenda, getItemsWalmart, retireItemWalmart, getSpecWalmart, bulkUploadWalmart, getFeedWalmart, getWarehouseAcenda, getCatalogAcenda, getSkuAcenda, addInventoryAcenda} from "@pythias/integrations"
export default async function Test(){
    //await updateListings()
    //await pullOrders()
    console.log(`${process.env.ssApiKey}:${process.env.ssApiSecret}`)
    let orders = await getOrders({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`})
    console.log(orders[1], orders[1].shipTo, orders[1].items, orders[1].items[0], orders[1].items[0].options, orders[1].orderStatus)
    const removeOutOfStockItemsWalmart = async ()=>{
        let items = await getItemsWalmart({clientId: process.env.walmartClientIdSS, clientSecret: process.env.walmartClientSecretSS, partnerId: process.env.walmartPartnerId, params: [{limit: "300"}]})
        for(let item of items){
            console.log(item, item.variantGroupInfo,"retire item")
            await retireItemWalmart({clientId: process.env.walmartClientIdSS, clientSecret: process.env.walmartClientSecretSS, partnerId: process.env.walmartPartnerId, sku: item.sku})
         }
    }
    //removeOutOfStockItemsWalmart()
    //getSpecWalmart({clientId: process.env.walmartClientIdSS, clientSecret: process.env.walmartClientSecretSS, partnerId: process.env.walmartPartnerId, type: "T-Shirts"})
    const productStageUrl = "https://stage-api.target.com/sellers/v1/​";
    const taxonomyStageUrl = "https://api-target.com/item_taxonomies/v2/taxonomy"
    const prodTargetPlusAPISpecsUrl = "https://plus.target.com/docs/spec/seller#overview"



    // let headers = {
    //     headers: {
    //         "x-api-key": process.env.stagingTargetApiKey,
    //         "x-seller-id": process.env.stagingTargetSellerId,
    //         "x-seller-token": process.env.stagingTargetSellerToken
    //     }
    // }
    // console.log(headers)
    // // let res = await axios.post(`https://stage-api.target.com/sellers/v1/sellers/${process.env.stagingTargetSellerId}/report_requests`, {type: "BULK_PRODUCT_DATA_TEMPLATE", parameters:{item_type_id: "1743507941"}}, headers).catch(err=>{console.log(err.response.data)})
    // // console.log(res.data)
    // let res = await axios.get(`https://stage-api.target.com/sellers/v1/sellers/${process.env.stagingTargetSellerId}/report_requests?page=5`, headers).catch(err=>{console.log(err.response.data)})
    // if(res) {
    //     console.log(res.data)
    //     // let res2 = await axios.get(res.data[res.data.length - 1].download_url, headers).catch(err=>{console.log(err.response.data)})
    //     // if(res2) {
    //     //     console.log(res2.data)
    //     //     console.log(res2.data,  Buffer.from(res2.data, "binary"))
    //     //     fs.writeFile("target.txt", Buffer.from(res2.data, "binary"), (err)=>{
    //     //         if(err) console.log(err)
    //     //     })
    //     // }
        
    //}
    
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