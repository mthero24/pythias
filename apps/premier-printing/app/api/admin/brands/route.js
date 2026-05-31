import {NextApiRequest, NextResponse} from "next/server";
import { Brands } from "@pythias/mongo";

export async function GET() {
    const brands = await Brands.find({}).select("name").sort({ name: 1 }).lean();
    return NextResponse.json({ brands });
}

export async function POST(req=NextApiRequest){
    let data = await req.json()
    let brand = new Brands(data);
    brand.marketPlaces = [];
    brand = await brand.save();
    let brands = await Brands.find({})
    return NextResponse.json({error: false, brands, brand})
}