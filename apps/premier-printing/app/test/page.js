import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size} from "@pythias/mongo"
export default async function Test(){
    let skus = await SkuToUpc.find({ standerdized: { $in: [false, null] }, temp: { $in: [false, null] }}).populate("design", "sku").populate("blank", "code").populate("color", "name sku").limit(1000)
    while(skus.length > 0){
        console.log(skus.length, "skus")
        for(let sku of skus){
            if(!sku.design || !sku.blank || !sku.color || !sku.size){
                let sku2 = await SkuToUpc.findOne({_id: sku._id}).lean()
                await SkuToUpcOld.create(sku2)
                await SkuToUpc.findOneAndDelete({_id: sku2._id})
            }else{
                console.log(sku.sku, `${sku.blank.code}_${sku.color.sku}_${sku.size}_${sku.design.sku}`, sku.upc, sku.gtin)
                let otherSkus = await SkuToUpc.find({ _id: {$nin: [sku._id]}, sku: `${sku.blank.code}_${sku.color.sku}_${sku.size}_${sku.design.sku}` }).populate("design", "sku").populate("blank", "code").populate("color", "name sku")
                console.log(otherSkus)
                sku.previousSkus = sku.previousSkus || []
                if (!sku.previousSkus.includes(sku.sku))sku.previousSkus.push(sku.sku)
                sku.sku = `${sku.blank.code}_${sku.color.sku}_${sku.size}_${sku.design.sku}`
                sku.standerdized = true
                sku.previousUpcs = sku.previousUpcs || []
                if(otherSkus.length > 0){
                    console.log("other skus", otherSkus.length)
                    for(let otherSku of otherSkus){
                        if(sku.gtin){
                            sku.previousSkus = sku.previousSkus || []
                            if (!sku.previousSkus.includes(otherSku.sku)) sku.previousSkus.push(otherSku.sku)
                            if(otherSku.preciousSkus && sku.previousSkus.length > 0){
                                for(let osps of otherSku.previousSkus){
                                    if(!sku.previousSkus.includes(osps)) sku.previousSkus.push(osps)
                                }
                            }
                            if(otherSku.gtin){
                                sku.previousUpcs = sku.previousUpcs || []
                                sku.previousUpcs.push({upc: otherSku.upc, gtin: otherSku.gtin})
                            }
                            await SkuToUpc.findOneAndDelete({_id: otherSku._id})
                            await sku.save()
                        }else{
                            if(otherSku.gtin){
                                if(!otherSku.previousSkus) otherSku.previousSkus = []
                                if (!otherSku.previousSkus.includes(sku.sku)) otherSku.previousSkus.push(sku.sku)
                                if(sku.previousSkus && sku.previousSkus.length > 0){
                                    for(let sps of sku.previousSkus){
                                        if(!otherSku.previousSkus.includes(sps)) otherSku.previousSkus.push(sps)
                                    }
                                }
                                if(!otherSku.previousUpcs) otherSku.previousUpcs = []
                                otherSku.previousUpcs.push({upc: sku.upc, gtin: sku.gtin})
                                await SkuToUpc.findOneAndDelete({ _id:sku._id })
                                await otherSku.save()
                            }else{
                                sku.previousSkus = sku.previousSkus || []
                                if (!sku.previousSkus.includes(otherSku.sku)) sku.previousSkus.push(otherSku.sku)
                                if (otherSku.previousSkus && sku.previousSkus.length > 0) {
                                    for (let osps of otherSku.previousSkus) {
                                        if (!sku.previousSkus.includes(osps)) sku.previousSkus.push(osps)
                                    }
                                }
                                await SkuToUpc.findOneAndDelete({ _id: otherSku._id })
                                await sku.save()
                            }
                        }
                    }
                } else {
                    console.log("save")
                    await sku.save()
                }
            }
        }
        skus = await SkuToUpc.find({ standerdized: { $in: [false, null] } }).populate("design", "sku").populate("blank", "code").populate("color", "name sku").limit(1000)
    }

    return <h1>test</h1>
}