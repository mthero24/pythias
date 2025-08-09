import {NextApiRequest, NextResponse} from "next/server";
import Brands from "@/models/Brands";
export async function POST(req=NextApiRequest){
    let data = await req.json()
    let brand = new Brands(data);
    brand.marketPlaces = [];
    brand = await brand.save();
    let brands = await Brands.find({})
    return NextResponse.json({error: false, brands, brand})
}