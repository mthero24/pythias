import {NextApiRequest, NextResponse} from "next/server";
import UpcToSku from "@/models/skuUpcConversion";
export async function GET(req){
    let blank = req.nextUrl.searchParams.get("blank")
    let design = req.nextUrl.searchParams.get("design")
    let sku = await UpcToSku.find({design: design, blank: blank}).populate("blank", "name code").populate("design", "name sku").populate("color", "name")
    return NextResponse.json({error: false, upc: sku})
}