import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, MarketPlaces, ApiKeyIntegrations, Item, Inventory} from "@pythias/mongo"
import axios from "axios";
import {fetchOrders} from "@pythias/integrations"


export default async function Test(){
    let credentials = await ApiKeyIntegrations.find({type: "etsy"})
    console.log(credentials)
    for(let cred of credentials){
        fetchOrders(cred)
    }
    return <h1>test</h1>
    //("https://images1.pythiastechnologies.com/styles/1742087292890.png")
}