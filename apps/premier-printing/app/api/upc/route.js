import {NextApiRequest, NextResponse} from "next/server";
import {SkuToUpc as UpcToSku} from "@pythias/mongo";
let sizeConverter = {
    XSmall: "XS",
    XXSmall: "XXS",
    Small: "S",
    Medium: "M",
    Large: "L",
    XLarge: "XL",
    XXLarge: "2XL",
    XXXLarge: "3XL",
}
export async function GET(req){
    let blank = req.nextUrl.searchParams.get("blank")
    let design = req.nextUrl.searchParams.get("design")
    let upcSku = req.nextUrl.searchParams.get("sku")?.trim()
    let sku
    if(upcSku){
        sku = await UpcToSku.find({$or: [{sku: upcSku}, {upc: upcSku}]}).populate("design", "name").populate("color", "name").populate({path: "blank", select:"code name sizes colors", populate: "colors"})
    }else{
        sku = await UpcToSku.find({design: design, blank: blank}).populate("blank", "name code").populate("design", "name sku").populate("color", "name")
    }
    return NextResponse.json({error: false, upc: sku, count: sku.length})
    //makke a change
}
export async function POST(req=NextApiRequest){
    let data = await req.json()
    if(data.count){
        //console.log("Getting temp upcs", data.count)
        let upcs = await UpcToSku.find({ temp: true, hold: {$in: [false, null]} }).limit(data.count).populate("design", "name").populate({ path: "blank", select: "code name sizes colors", populate: "colors" }).populate("color", "name")
        await UpcToSku.updateMany({ _id: { $in: upcs.map(u => u._id) } }, { $set: { hold: true } })
        //console.log("upcs", upcs)
        return NextResponse.json({ error: false, upcs })
    }
    let upcs = await UpcToSku.find({ design: data.design._id, blank: { $in: data.blanks.map(b => b._id) } }).populate("design", "name").populate({ path: "blank", select: "code name sizes colors", populate: "colors", }).populate("color", "name")
    for(let upc of upcs){
        if (sizeConverter[upc.size]) {
            upc.size = sizeConverter[upc.size]
            upc = await upc.save()
        }
        if(upc.gtin == undefined || upc.gtin == null || upc.gtin == ""){
            //console.log("Found UPC without GTIN:", upc)
            let sku = await UpcToSku.findOne({temp: true, hold: {$in: [false, null]}})
            upc.gtin = sku.gtin
            upc.upc = sku.upc
            await UpcToSku.findOneAndDelete({_id: sku._id})
            upc = await upc.save()
            //console.log("Updated UPC with GTIN:", upc)
        }
    }
    //console.log(upcs)
    return NextResponse.json({error: false, upcs})
}

export async function PUT(req=NextApiRequest){
    let data = await req.json()
    await UpcToSku.findByIdAndUpdate(data.upc._id, data.upc)
    let skus = await UpcToSku.find({$or: [{design: null, blank: {$ne: null}, recycle: false},{color: null, blank: {$ne: null}, recycle: false}]}).populate("design", "name").populate("color", "name").populate({path: "blank", select:"code name sizes colors", populate: "colors"}).limit(50)
    let count = await UpcToSku.find({$or: [{design: null, blank: {$ne: null}, recycle: false},{color: null, blank: {$ne: null}, recycle: false}]}).countDocuments()
    return NextResponse.json({error: false, skus, count})
}