import axios from "axios";
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

export async function getProductInfoByStyleColorSize(style, color, size) {
    let xml = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:impl="http://impl.webservice.integration.sanmar.com/">
            <soapenv:Header/>
            <soapenv:Body>
                <impl:getProductInfoByStyleColorSize>
                    <!--Zero or more repetitions:-->
                    <arg0>
                        <!--Optional:-->
                        ${size ? `<size>${size}</size>` : ""}

                        <!--Optional:-->
                        ${color ? `<color>${color}</color>` : ""}
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
    let res = await axios.post("https://ws.sanmar.com:8080/SanMarWebService/SanMarProductInfoServicePort", xml, {
        headers: {
            "Content-Type": "text/xml"
        }
    })
    //console.log(res.data)
    var parser = new xml2js.Parser(options);
    let data = await parser.parseStringPromise(res.data);
    //console.log(data["S:Envelope"]["S:Body"][0]["ns2:getProductInfoByStyleColorSizeResponse"][0]["return"][0])
    let error = data["S:Envelope"]["S:Body"][0]["ns2:getProductInfoByStyleColorSizeResponse"][0]["return"][0]["errorOccured"][0] == "false" ? false : true
    let jsonProducts = []
    if (!error) {
        let products = data["S:Envelope"]["S:Body"][0]["ns2:getProductInfoByStyleColorSizeResponse"][0]["return"][0]["listResponse"]
        for (let p of products) {
            let prod = {}
            for (let key in p) {
                prod[key] = p[key][0]
                for (let k in prod[key]) {
                    prod[key][k] = prod[key][k][0]
                }
            }
            jsonProducts.push(prod)
        }
    }
    return { error, products: jsonProducts }
}