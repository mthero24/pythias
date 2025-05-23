import {NextApiRequest, NextResponse} from "next/server";
import UpcToSku from "@/models/skuUpcConversion";
export async function GET(req){
    let blank = req.nextUrl.searchParams.get("blank")
    let design = req.nextUrl.searchParams.get("design")
    if(design && blank && blank != "undefined"){
        let sku = await UpcToSku.find({design: design, blank: blank}).populate("blank", "name code").populate("design", "name sku").populate("color", "name")
        console.log(sku.length)
        return NextResponse.json({error: false, upc: sku})
    } else return NextResponse.json({error: true, msg: "missing design or blank"})
}

export async function PUT(req=NextApiRequest){
    let data = await req.json()
    let upc = await UpcToSku.findByIdAndUpdate(data.upc._id, data.upc)
    let skus = await await UpcToSku.find({$or: [{design: null, blank: {$ne: null}, recycle: false},{color: null, blank: {$ne: null}, recycle: false}]}).populate("design", "name").populate("color", "name").populate({path: "blank", select:"code name sizes colors", populate: "colors"}).limit(50)
    let count = await UpcToSku.find({$or: [{design: null, blank: {$ne: null}, recycle: false},{color: null, blank: {$ne: null}, recycle: false}]}).countDocuments()
    return NextResponse.json({error: false, skus, count})
}