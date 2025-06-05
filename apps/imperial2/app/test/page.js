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
    // console.log(`${process.env.ssApiKey}:${process.env.ssApiSecret}`)
    // let orders = await getOrders({auth: `${process.env.ssApiKey}:${process.env.ssApiSecret}`})
    // console.log(orders[2], orders[2].shipTo, orders[2].items, orders[2].items[0], orders[2].items[0].options, orders[2].orderStatus)
    
    return <h1>test</h1>
}