import {createTikTokCsv, createShopifyCsv} from "@pythias/integrations"
import {Design, CSVUpdates} from "@pythias/mongo";
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import {getOrderKohls, NextGTIN, CreateUpdateUPC, getTokenAcenda, getItemsWalmart, retireItemWalmart, getSpecWalmart, bulkUploadWalmart, getFeedWalmart, getWarehouseAcenda, getCatalogAcenda, getSkuAcenda, addInventoryAcenda} from "@pythias/integrations"
import { createUpc } from "@/functions/createUpcs"
const s3 = new S3Client({ credentials:{
    accessKeyId:'XWHXU4FP7MT2V842ITN9',
   secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
}, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3


const update = async(csvupdate, url, marketplace )=>{
    let csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
    if(!csvUpdate.files) csvUpdate.files={}
    console.log(csvUpdate.files)
    csvUpdate.files[`${marketplace}`] = `https://images1.pythiastechnologies.com/${url}`
    csvUpdate.dataParsed = true
    csvUpdate.csvReady= true
    csvUpdate.active = false
    csvUpdate.markModified("files")
    console.log(csvUpdate.files)
    csvUpdate = await csvUpdate.save()
}
const createProductImages = (design, blank,)=>{
    let images = []
    if(design.threadColors && design.threadColors.length > 0){
        for(let tc of design.threadColors){
            let designImages = design.threadImages[tc.name]
            for(let key of Object.keys(designImages)){
                if(designImages[key]){
                    let blankImages = blank.blank.multiImages[key]
                    //console.log(blank.blank.code, Object.keys(blank.blank.multiImages), key, blankImages, "blank images")
                    if(blank.defaultColor){
                        let colorImages = blankImages?.filter(bi=> bi.color.toString() == blank.defaultColor._id.toString() &&  bi.imageGroup == design.imageGroup)
                        if (!colorImages || colorImages?.length == 0) colorImages = blankImages?.filter(bi => bi.color.toString() == blank.defaultColor._id.toString() &&  bi.imageGroup == "default")
                        for(let ci of colorImages? colorImages: []){
                            console.log(ci._id)
                            images.push(encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${blank.blank.code}-${ci.image.split("/")[ci.image.split("/").length - 1].split(".")[0]}-${blank.defaultColor.name}-${key}-${tc.name}.jpg?width=1200`))
                        }
                    }
                    let colors
                    if(blank.defaultColor){
                        colors = blank.colors.filter(bc=> bc._id.toString() != blank.defaultColor._id.toString())
                    }else{
                        colors = blank.colors
                    }
                    for(let color of colors){
                        let colorImages = blankImages?.filter(bi=> bi.color.toString() == color._id.toString() &&  bi.imageGroup == design.imageGroup)
                        if (!colorImages || colorImages.length == 0) colorImages = blankImages?.filter(bi=> bi.color.toString() == color._id.toString() &&  bi.imageGroup == "default")
                        for(let ci of colorImages? colorImages: []){
                            console.log(ci._id)
                            images.push(encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${blank.blank.code}-${ci.image.split("/")[ci.image.split("/").length - 1].split(".")[0]}-${color.name}-${key}-${tc.name}.jpg?width=1200`))
                        }
                    }
                }
            }
        }
    }else{
        let designImages = design.images
        for(let key of Object.keys(designImages)){
            if(designImages[key]){
                let blankImages = blank.blank.multiImages[key]
                let tempImages = blankImages.filter(i=> i.imageGroup == design.imageGroup)
                if(tempImages.length == 0){
                    blankImages = blankImages.filter(i=> i.imageGroup == "default")
                }else blankImages = tempImages
                if(blank.defaultColor){
                    let colorImages = blankImages?.filter(bi=> bi.color.toString() == blank.defaultColor._id.toString())
                    for(let ci of colorImages? colorImages: []){
                      //  console.log(ci._id)
                        images.push(encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${blank.blank.code}-${ci.image.split("/")[ci.image.split("/").length - 1].split(".")[0]}-${blank.defaultColor.name}-${key}.jpg?width=1200`))
                    }
                }
                let colors
                if(blank.defaultColor){
                    colors = blank.colors.filter(bc=> bc._id.toString() != blank.defaultColor._id.toString())
                }else{
                    colors = blank.colors
                }
                for(let color of colors){
                    let colorImages = blankImages?.filter(bi=> bi.color.toString() == color._id.toString())
                    for(let ci of colorImages? colorImages: []){
                       // console.log(ci._id)
                        images.push(encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${blank.blank.code}-${ci.image.split("/")[ci.image.split("/").length - 1].split(".")[0]}-${color.name}-${key}.jpg?width=1200`))
                    }
                }
            }
        }
    }
    return images
}
const createVariantImages = (design, blank, color, threadColor)=>{
    let images = []
    let designImages
    if(threadColor){
        designImages = design.threadImages[threadColor.name]
        for(let key of Object.keys(designImages)){
            //console.log(key, blank.blank.code)
            if(designImages[key]){
                let blankImages = blank.blank.multiImages[key]
                let colorImages = blankImages?.filter(bi=> bi.color.toString() == color._id.toString())
                for(let ci of colorImages? colorImages: []){
                   // console.log(ci._id)
                    images.push(encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${blank.blank.code}-${ci.image.split("/")[ci.image.split("/").length - 1].split(".")[0]}-${color.name}-${key}.jpg?width=1200`))
                }
            }
        }
    }else{
        designImages = design.images
        for(let key of Object.keys(designImages)){
            if(designImages[key]){
                let blankImages = blank.blank.multiImages[key]
                let colorImages = blankImages.filter(bi=> bi.color.toString() == color._id.toString())
                for(let ci of colorImages){
                   // console.log(ci._id)
                    images.push(encodeURI(`https://imperial.pythiastechnologies.com/api/renderImages/${design.sku}-${blank.blank.code}-${ci.image.split("/")[ci.image.split("/").length - 1].split(".")[0]}-${color.name}-${key}.jpg?width=1200`))
                }
            }
        }
    }
    return images
}
export async function updateListings(csvupdate, sendTo){
    let csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
    try{
        let designs = await Design.find({sendToMarketplaces: true}).populate("brands b2m blanks.blank blanks.colors blanks.defaultColor threadColors").sort({'_id': -1}).limit(2000)
        //console.log(designs.length)
        let products = []
        let i = 0
        for(let design of designs){
           // console.log(i, "designs finished")
            i++
            //console.log(design.blanks.length)
            if(design.blanks.length > 0){
                
                for(let b of design.blanks){
                    //console.log(`${brand.name} ${design.name} ${b.blank.name}`, brand.name, `${design.description} ${b.blank.description}`)
                    if(b.blank){
                        let options= ["color", "size"];
                        let variants = []
                        if(design.threadColors && design.threadColors.length > 0){
                            options.push("thread color")
                            for(let t of design.threadColors){
                                for(let c of b.colors){
                                    for(let s of b.blank.sizes){
                                            let v = {
                                                sku: `${design.printType}_${design.sku}_${c.sku}_${s.name}_${b.blank.code}_${t.sku}`,
                                                size: s,
                                                color: c,
                                                threadColor: t,
                                                images: createVariantImages(design, b, c, t)
                                            }
                                            variants.push(v)
                                    }
                                }
                            }
                        }else{
                            for(let c of b.colors){
                                for(let s of b.blank.sizes){
                                        let v = {
                                            sku: `${design.printType}_${design.sku}_${c.sku}_${s.name}_${b.blank.code}`,
                                            size: s,
                                            color: c,
                                            images: createVariantImages(design, b, c)
                                        }
                                        variants.push(v)
                                }
                            }
                        }
                        let product = {
                            name: `${design.name} ${design.printType == "EMB"? "Embroidered": "Printed"} ${b.blank.name}`,
                            sku: `${design.sku}_${b.blank.code}`,
                            brand: b.blank.brand,
                            design: design,
                            blank: b,
                            options: options,
                            variants: variants,
                            images: createProductImages(design, b)    
                        }
                        products.push(product)
                    }
                }
            }
        }
       // console.log(products[0], products[1])
        csvUpdate.infoGathered = true
        csvUpdate = await csvUpdate.save()
        let url = await createTikTokCsv({products})
        await update(csvupdate, url, "tiktok")
        url = await createShopifyCsv({products})
        await update(csvupdate, url, "shopify")
        for(let design of designs){
            design.sendToMarketplaces = false
            await design.save()
        }
    }catch(e){
        //console.log(csvupdate, "update", e)
        let csvUpdate = await CSVUpdates.findOne({_id: csvupdate._id})
        csvUpdate.active= false
        csvUpdate.error = true
        csvUpdate = await csvUpdate.save()
    }
}