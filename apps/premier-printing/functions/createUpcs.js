import {NextGTIN, CreateUpdateUPC} from "@pythias/integrations"
import SkuToUpc from "@/models/skuUpcConversion"
export async function createUpc({design}){
    let brands= {
        "The Juniper Shop": ["TC", "TD", "FST", "TSWT", "TH", "RSTLS", "RSYSWT", "TTK", "YC", "YSWT", "YH", "RSYLS", "YTK", "YFTH", "RSO", "FSO", "ID", "LSO"],
        "Simply Sage Market": ["C", "SWT", "GDT", "GDSWT", "GDLS", "LGDSP", "LGDSWT", "LGDSET", "GDLSSET", "GDTSET", "RT", "BCT", "TK", "QZF", "HT", "H", "PPSET", "RB", "FTH", "CTH"]
    }
    for(let blank of design.blanks){
        for(let color of blank.colors){
            for(let size of blank.blank.sizes){
                //console.log(blank.blank.code, color, size, design.sku)
                let designImage
                let side
                for(let image of Object.keys(design.images)){
                    if(design.images[image] !== undefined && design.images[image] !== ""){
                        designImage = design.images[image]
                        side = image
                        break
                    }
                }
                let brand = brands["The Juniper Shop"].includes(blank.blank.code)? "The Juniper Shop" : "Simply Sage Market"
                let sku = `${blank.blank.code}_${color.name}_${size.name}_${design.sku}`
                let gtin
                let sku1 = await SkuToUpc.findOne({design: design._id, blank: blank.blank._id, color: color._id, size: size.name})
                if(!sku1){
                    sku1 = await SkuToUpc.findOne({recycle: true})
                    sku1.recycle = false
                    sku1 = await sku1.save()
                    console.log("recycle upc")
                }else{
                    console.log("found upc")
                    continue
                }
                if(sku1 && sku1.gtin){
                    gtin = {prefix: sku1.gtin.substring(1,8), gtin: sku1.gtin}
                }else if(sku1 && sku1.upc && sku1.upc.length == 12){
                    gtin = {prefix: `0${sku1.upc.substring(0,6)}`, gtin: `00${sku1.upc}`}
                }else{
                    console.log("new upc")
                    gtin = await NextGTIN({auth:{apiKey: process.env.gs1PrimaryProductKey, accountNumber: process.env.gs1AccountNumber}})
                }
                console.log(gtin, "gtin")
                let data = {
                    sku,
                    ...gtin,
                    industry: "General",
                    packagingLevel: "each",
                    productDescription: [{
                        value: `${brand} ${design.name} ${blank.blank.name} ${color.name} ${size.name}`,
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
                    labelDescription: `${sku}`,
                    imageUrl: `https://simplysage.pythiastechnologies.com/api/renderImages?colorName=${color.name}&blank=${blank.blank.code}&design=${designImage}&side=${side}`
                }
                let res = await CreateUpdateUPC({auth:{apiKey: process.env.gs1PrimaryProductKey, accountNumber: process.env.gs1AccountNumber}, body: data})
                if(!res.error){
                    console.log(res.product.gtin)
                    let skuToUpc = await SkuToUpc.findOne({gtin: res.product.gtin})
                    if(skuToUpc){
                        console.log("overrider")
                        skuToUpc.upc= res.product.gtin.replace("00", ""),
                        skuToUpc.sku= sku
                        skuToUpc.gtin= res.product.gtin,
                        skuToUpc.design= design._id,
                        skuToUpc.blank= blank.blank._id,
                        skuToUpc.color= color._id,
                        skuToUpc.size= size.name
                        skuToUpc.recycle = false
                    }else{
                        console.log("new")
                        skuToUpc = new SkuToUpc({
                            sku: sku,
                            upc: res.product.gtin.replace("00", ""),
                            gtin: res.product.gtin,
                            design: design._id,
                            blank: blank.blank._id,
                            color: color._id,
                            size: size.name,
                            recycle: false
                        })
                    }
                    await skuToUpc.save()
                }else break
            }
        }
    }
    return "done"
}

export async function MarkRecycle(design){
    let skus = await SkuToUpc.updateMany({design: design._id}, {recycle: true})
    return
}