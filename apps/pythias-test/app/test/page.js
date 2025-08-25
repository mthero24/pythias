import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, MarketPlaces, ApiKeyIntegrations, Inventory} from "@pythias/mongo"
import axios from "axios";
import { pullOrders } from "@/functions/pullOrders"
import {refreshToken} from "@pythias/integrations"
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
export default async function Test(){
    
    let connection = await ApiKeyIntegrations.findOne({provider: "pythias-test", type: "etsy"})
    // console.log(connection, "connection")
    // let newConnection = await refreshToken(connection.refreshToken)
    // connection.apiKey = newConnection.access_token
    // connection.refreshToken = newConnection.refresh_token
    // await connection.save()
    const requestOptions = {
        headers: {
            "x-api-key": "480pxuspxi5wz93puk47snye",
        },
    };
    let url = `https://openapi.etsy.com/v3/application/shops?shop_name=PythiaShop`;
    let response = await axios.get(
        url,
        {
            headers: {
                "x-api-key": "480pxuspxi5wz93puk47snye",
                Authorization: `Bearer ${connection.apiKey}`,
            },
        }
    ).catch(e=>console.log(e.response.data));

    console.log(response?.data);
    return <h1>test</h1>
}