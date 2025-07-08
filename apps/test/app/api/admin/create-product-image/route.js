import {NextApiRequest, NextResponse} from "next/server";
import ProductImages from "@/models/ProductImages";

export async function GET(req=NextApiRequest){
    return NextResponse.json({error: false})
}
export async function POST(req=NextApiRequest){
    let data = await req.json();
    try{
        if(data.type == "primary"){
            await ProductImages.deleteMany({ design: data.design, blank: data.blank, color: data.color, marketPlace: data.marketPlace, brand: data.brand, type: "primary"})
        }
        let image = new ProductImages(data);
        image = await image.save()
        let productImages = await ProductImages.find({design: data.design})
        return NextResponse.json({error: false, image, productImages})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}
export async function PUT(req=NextApiRequest){
    let data = await req.json();
    try{
        let image = await ProductImages.findOneAndDelete(data)
        let productImages = await ProductImages.find({design: data.design})
        return NextResponse.json({error: false, image, productImages})
    }catch(e){
        console.log(e)
        return NextResponse.json({error: true, msg: JSON.stringify(e)})
    }
}