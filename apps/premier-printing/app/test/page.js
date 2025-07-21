import {NextGTIN, CreateUpdateUPC} from "@pythias/integrations";
import {SkuToUpc} from "@pythias/mongo";
export default async function Test(){
   let auth = {
       apiKey: process.env.gs1PrimaryProductKey,
       accountNumber: process.env.gs1AccountNumber
    }
    
    const createTempUpcs = async () => {
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
    const updateTempUpc = async (skuToUpc, newUpc) => {
        let data = createGTINData({
            sku: skuToUpc.sku,
            newUpc: { prefix: newUpc.skuToUpc.substring(1, 8), gtin: skuToUpc.gtin },
            brand: skuToUpc.brand || "temporary",
            image: skuToUpc.image || "",
            productDescription: skuToUpc.productDescription || "temporary hold"
        })
        let res = await CreateUpdateUPC({auth:{apiKey: process.env.gs1PrimaryProductKey, accountNumber: process.env.gs1AccountNumber}, body: data})
        return res
    }
    let temp = await SkuToUpc.findOne({ temp: true })
    
    return <h1>test</h1>
}