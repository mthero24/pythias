import {NextApiRequest, NextResponse} from "next/server"
import TikTokAuth from "@/models/tiktok";
import SkuToUpc from "@/models/skuUpcConversion";
import Design from "@/models/Design";
import Blanks from "@/models/Blanks"
import { createTikTokProduct } from "@/functions/tikTok";


export async function POST(req=NextApiRequest){
    let data = await req.json();
    console.log(data, "data from tiktok send route");
    let product = await createTikTokProduct({product: data.product, credentials: data.connection});
    console.log(product, "product after create");
    return NextResponse.json({error: false})
}