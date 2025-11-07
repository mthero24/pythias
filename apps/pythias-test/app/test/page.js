import { Nightlife } from "@mui/icons-material";
import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size, Products, MarketPlaces, ApiKeyIntegrations, Item, Inventory} from "@pythias/mongo"
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
var xml2js = require("xml2js");
let options = {
    object: true,
    reversible: false,
    coerce: false,
    sanitize: true,
    trim: true,
    arrayNotation: false,
    alternateTextNode: true,
};
export default async function Test(){
    let size = "S"
    let color = "Red"
    let style = "1717"
    let xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:impl="http://impl.webservice.integration.sanmar.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <impl:getProductInfoByStyleColorSize>
         <!--Zero or more repetitions:-->
         <arg0>
            <!--Optional:-->
            <size>${size}</size>

            <!--Optional:-->
            <color>${color}</color>
            <!--Optional:-->
            <style>${style}</style>
         </arg0>
         <!--Optional:-->
         <arg1>
            <!--Optional:-->
            <sanMarCustomerNumber>${process.env.sanmarAccount}</sanMarCustomerNumber>
            <!--Optional:-->
            <sanMarUserName>${process.env.sanmarUserName}</sanMarUserName>
            <!--Optional:-->
            <sanMarUserPassword>${process.env.sanmarPassword}</sanMarUserPassword>
            <!--Optional:-->
            <senderId>?</senderId>
            <!--Optional:-->
            <senderPassword>?</senderPassword>
         </arg1>
      </impl:getProductInfoByStyleColorSize>
   </soapenv:Body>
</soapenv:Envelope>`
    console.log(xml)
    let res = await axios.post("https://ws.sanmar.com:8080/SanMarWebService/SanMarProductInfoServicePort", xml, {
        headers: {
            "Content-Type": "text/xml"
        }
    })
    //console.log(res.data)
    var parser = new xml2js.Parser(options);
    let data = await parser.parseStringPromise(res.data);
    console.log(data["S:Envelope"]["S:Body"][0]["ns2:getProductInfoByStyleColorSizeResponse"][0]["return"][0])
    let error = data["S:Envelope"]["S:Body"][0]["ns2:getProductInfoByStyleColorSizeResponse"][0]["return"][0]["errorOccured"][0] == "false"? false: true
    let products = data["S:Envelope"]["S:Body"][0]["ns2:getProductInfoByStyleColorSizeResponse"][0]["return"][0]["listResponse"]
    let jsonProducts = []
    for(let p of products){
        let prod = {}
        for(let key in p){
            prod[key] = p[key][0]
        }
        jsonProducts.push(prod)
    }
    console.log(jsonProducts)
    // for(let msg of data["wsdl:definitions"]["wsdl:message"]){
    //     console.log(msg["wsdl:part"])
    // }
    return <h1>test</h1>
}