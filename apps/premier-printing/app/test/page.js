import {Design, SkuToUpc, SkuToUpcOld, Blank, Color, Size} from "@pythias/mongo"
export default async function Test(){
    let getMore = async(skip)=>{
        let dups = await SkuToUpc.aggregate(
            [   {
                $match: {
                    'temp': {$in: [false, null]}
                }
            },
            {
                 '$group': {
                     '_id': {
                         '_id': '_id',
                         'design': '$design',
                         'blank': '$blank',
                         'color': '$color',
                         'size': '$size'
                     }, 
                    'count': {
                        '$sum': 1
                    },
                    'duplicates': {
                        '$addToSet': '$_id'
                    }
                }
            }, {
                '$match': {
                    'count': {
                        '$gt': 1
                    }
                }
            }, {
                '$project': {
                    '_id': 0,
                    'duplicates': 1
                }
            }
        ]
    )
    return dups
}
    let dups = await getMore(0)
    // let skip = 500
    console.log("dups", dups.length)
    for(let i = 1; i < dups.length; i++){
        console.log("dups", i)
        let skus = []
        for(let sku of dups[i].duplicates){
            let s = await SkuToUpc.findOne({_id: sku}).populate("color", "name").populate("design", "name sku").populate({path: "blank", select:"code"})
            if(s){
                if(s.design == undefined || s.design == null){
                    let designSku = ""
                    let pieces = s.sku.split("_")
                    for(let piece of pieces.slice(3, pieces.length)){
                        console.log("piece", piece)
                        if(designSku == "") designSku = piece
                        else designSku = `${designSku}_${piece}`
                    }
                    console.log("designSku", designSku)
                    s.design = await Design.findOne({sku: designSku}).select("_id name").lean()
                    if(!s.design) {
                        let old = await SkuToUpc.findById(s._id).lean()
                        await SkuToUpcOld.create(old)
                        await SkuToUpc.findByIdAndDelete(s._id)
                        console.log("Deleted old sku", s._id.toString())
                    }
                }
                skus.push(s)
            }
        }
        let primary
        for(let sku of skus){
            if(sku.color == undefined || sku.color == null){
                console.log("No color found for", sku.sku.split("_")[1], sku._id.toString())
                sku.color = await Color.findOne({name: sku.sku.split("_")[1]}).select("_id name").lean()
            }
            console.log("sku", sku.sku, sku.color.name, sku._id.toString())
            if(sku.sku.includes(sku.color.name)) primary = sku
        }
        if(!primary){
            console.log("No primary found for", skus[0].sku, skus[0].color.name, skus.map(s => s.upc), skus.map(s => s.gtin), skus.map(s => s.size))
            primary = skus.filter(s => s.gtin)[0]
            console.log(primary)
            if(!primary) primary = skus[0]
            primary.previousSkus = []
            primary.previousSkus.push(primary.sku)
            if(primary.design) primary.sku = `${primary.blank.code}_${primary.color.name}_${primary.size}_${primary.design.sku}`
            else continue
        }
        if(!primary.previousSkus) primary.previousSkus = []
        if(!primary.previousUpcs) primary.previousUpcs = []
        for(let sku of skus){
            if(sku._id.toString() == primary._id.toString()) continue
            if(!primary.previousSkus.includes(sku.sku)) primary.previousSkus.push(sku.sku)
            if(!primary.previousUpcs.filter(p => p.upc == sku.upc)) primary.previousUpcs.push({upc: sku.upc, gtin: sku.gtin})
            await SkuToUpc.findOneAndDelete({_id: sku._id})
            console.log("Deleting", sku.sku, sku._id.toString())
        }
        if(primary && primary.design){
            let error
            await primary.save().catch(async err => {
                console.error("Error saving primary sku", primary.sku, err)
                error = err
                let dups = await SkuToUpc.find({sku: primary.sku}).populate("design", "name sku").populate("color", "name").populate({path: "blank", select:"code"})
                for(let d of dups){
                    console.log(d.design.sku, d.color.name, d.blank.code, d.sku)
                    d.sku = `${d.blank.code}_${d.color.name}_${d.size}_${d.design.sku}`
                    await d.save().catch(err => {
                        console.error("Error saving duplicate sku", d.sku, err)
                    })
                }
                console.log("Found duplicates for primary sku", primary.sku, dups.map(d=> d.design.sku), dups.length)
            })
        }
    }
    return <h1>test</h1>
}