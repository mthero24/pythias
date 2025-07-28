import {Products, Design} from "@pythias/mongo";
import {NextApiRequest, NextResponse } from "next/server";

export async function POST(req = NextApiRequest) {
    const data = await req.json();
    let products = [];
    for (let product of data.products) {
        if (product._id) {
            product = await Products.findByIdAndUpdate(product._id, product, { new: true, returnNewDocument: true }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
        } else {
            product = await Products.create(product)
            product = await Products.findById(product._id).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
        }
        products.push(product);
    }
    return NextResponse.json({ error: false, products });
}