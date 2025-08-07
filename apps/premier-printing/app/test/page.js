import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, marketPlaces, ApiKeyIntegrations, Inventory} from "@pythias/mongo"
import axios from "axios";
let converter = {
    YL: "L",
    YS: "S",
    YM: "M",
    YXL: "XL",
    YXXL: "2XL",
}
export default async function Test(){
    // let headers = {
    //     headers: {
    //         "Authorization": `Basic ${btoa(`${process.env.ssApiKey}:${process.env.ssApiSecret}`)}`
    //     }
    // }
    // let res = await axios.get(`https://ssapi.shipstation.com/orders?orderNumber=cs_6650176890_1-A`, headers).catch(e => { console.log(e.response.data) })
    // console.log(res.data, "res data")

    return <h1>test</h1>
}