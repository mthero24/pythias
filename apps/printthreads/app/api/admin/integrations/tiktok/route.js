import {NextApiRequest, NextResponse} from "next/server"
import { TikTokAuth } from "@pythias/mongo";
import { SkuToUpc } from "@pythias/mongo";
import { Design } from "@pythias/mongo";
import { Blank as Blanks } from "@pythias/mongo"
import { createTikTokProduct } from "@/functions/tikTok";


export async function POST(req=NextApiRequest){
    let data = await req.json();
    console.log(data, "data from tiktok send route");
    let product = await createTikTokProduct({product: data.product, credentials: data.connection});
    console.log(product, "product after create");
    return NextResponse.json({error: false})
}