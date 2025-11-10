import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, MarketPlaces, ApiKeyIntegrations, Item, Inventory} from "@pythias/mongo"
import axios from "axios";
import { pullOrders } from "@/functions/pullOrders"
import {refreshToken} from "@pythias/integrations"
import {getProductInfoByStyleColorSize, getProductInfoByBrand} from "@pythias/inventory"
export default async function Test(){
   
    let item = await getProductInfoByBrand("Comfort Colors")
    console.log(item.products)
    return <h1>test</h1>
}