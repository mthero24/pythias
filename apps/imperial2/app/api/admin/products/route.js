import {Products, Design} from "@pythias/mongo";
import {NextApiRequest, NextResponse } from "next/server";

export async function POST(req = NextApiRequest) {
    const data = await req.json();
    let product
    if(data.product._id) {
        product = await Products.findByIdAndUpdate(data.product._id, data.product, { new: true, returnNewDocument: true}).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({path:"blanks", populate: "colors"});
        //console.log(product.variants["CC1717"]["Pink"]["White"], "updated product")
    }else{
        product = await Products.create(data.product);
    }
    return NextResponse.json({product, error: false});
}