import axios from "axios"
import { SkuToUpc } from "@pythias/mongo";
// get next available gtin

export async function NextGTIN({auth}){
    let headers = {
        headers:{
            "Cache-Control": "no-cache",
            ApiKey: auth.apiKey,
            "X-Product-Owner-Account-Id": auth.accountNumber
        }
    }
    let resPre = await axios.get("https://api.gs1us.org/api/v1/myprefix", headers).catch(e=>{console.log(e.response.data)})
    while(!resPre){
        await new Promise((resolve)=>{
            setTimeout(()=>{
                resolve()
            },1000)
        })
        resPre = await axios.get("https://api.gs1us.org/api/v1/myprefix", headers).catch(e=>{console.log(e.response.data)})
    }
    let prefix = resPre?.data.filter(p=> p.remainingCapacity > 0)[0]
    if(prefix){
        let resNext = await axios.get(`https://api.gs1us.org/api/v1/myprefix/${prefix.prefix}/gtin/next`, headers).catch(e=>{console.log(e.response?.data)})
        while(!resNext){
            await new Promise((resolve)=>{
                setTimeout(()=>{
                    resolve()
                },1000)
            })
            resNext = await axios.get(`https://api.gs1us.org/api/v1/myprefix/${prefix.prefix}/gtin/next`, headers).catch(e=>{console.log(e.response?.data)})
        }
        if(resNext?.data && resNext.data.gtin) return resNext.data
    }
    return null
}

export async function CreateUpdateUPC({auth, body}){
    let headers = {
        headers:{
            "Cache-Control": "no-cache",
            ApiKey: auth.apiKey,
            "X-Product-Owner-Account-Id": auth.accountNumber
        }
    }
    let res = await axios.post(`https://api.gs1us.org/api/v1/myproduct/${body.gtin}`, body, headers).catch(e=>{console.log(e.response?.data)})
    return {error: res?.data?.product == undefined, product: res?.data?.product}
}

export async function GetUpc({gtin}){
    let res = await axios.get(`https://api.gs1us.org/api/v1/myproduct/${gtin}`, headers).catch(e=> console.log(e.response?.data))
    return res?.data
}
export const createTempUpcs = async () => {
    let auth = {
        apiKey: process.env.gs1PrimaryProductKey,
        accountNumber: process.env.gs1AccountNumber
     }
    let tempUpcs = await SkuToUpc.find({ temp: true }).countDocuments()
    while(tempUpcs < 1000){
        let newUpc = await NextGTIN({auth})
        if(newUpc){
            let data = createGTINData({
                sku: `SKU-${newUpc.gtin}`,
                newUpc,
                brand: "temporary",
                image: "",
                productDescription: "temporary hold"
            })
            let res = await CreateUpdateUPC({auth:{apiKey: process.env.gs1PrimaryProductKey, accountNumber: process.env.gs1AccountNumber}, body: data})
            if(!res.error){
                await SkuToUpc.create({
                    sku: `SKU-${newUpc.gtin}`,
                    upc: newUpc.gtin.substring(2, newUpc.gtin.length),
                    color: null,
                    size: null,
                    blank: null,
                    design: null,
                    gtin: newUpc.gtin,
                    recycle: false,
                    temp: true
                })
            }else{
                break;
            }


        }
        tempUpcs = await SkuToUpc.find({ temp: true }).countDocuments()
        console.log("temp upcs", tempUpcs)
    }
}
const createGTINData = ({sku, newUpc, brand, image, productDescription }) => {
    let data = {
        sku: sku,
        ...newUpc,
        industry: "General",
        packagingLevel: "each",
        productDescription: [{
            value: productDescription,
            language: "en"
        }],
        status: "in use",
        brandName: [{
            language: "en",
            value: brand
        }],
        isVariable: false,
        isPurchaseable: true,
        targetMarket: ["US"],
        labelDescription: `SKU-${newUpc.gtin}`,
        imageUrl: image
    }
    return data
}
export const updateTempUpc = async (skuToUpc) => {
    let data = createGTINData({
        sku: skuToUpc.sku,
        newUpc: { prefix: skuToUpc.gtin.substring(1, 8), gtin: skuToUpc.gtin },
        brand: skuToUpc.brand || "temporary",
        image: skuToUpc.image || "",
        productDescription: skuToUpc.productDescription || "temporary hold"
    })
    let res = await CreateUpdateUPC({auth:{apiKey: process.env.gs1PrimaryProductKey, accountNumber: process.env.gs1AccountNumber}, body: data})
    return res
}
