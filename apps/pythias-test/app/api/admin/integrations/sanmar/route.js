import {NextApiRequest, NextResponse} from "next/server"
import { getProductInfoByBrand } from "@pythias/inventory";


export async function POST(req=NextApiRequest){
    let data = await req.json();
    console.log(data, "data from sanmar route");
    let productInfo = await getProductInfoByBrand(data.brandName);
    console.log(productInfo, "product info from sanmar");
    return NextResponse.json({error: false, productInfo})
}