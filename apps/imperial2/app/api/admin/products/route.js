import {Products, Design} from "@pythias/mongo";
import {NextApiRequest, NextResponse } from "next/server";
import {saveProducts} from "@pythias/backend";

export async function GET(req = NextApiRequest) {
    const product = req.nextUrl.searchParams.get("products");
    if (!product) {
        return NextResponse.json({ error: true, message: "Product ID is required" });
    }
    const productData = await Products.find({ _id: { $in: product.split(",") } }).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" }).lean();
    if (!productData) {
        return NextResponse.json({ error: true, message: "Product not found" });
    }
    return NextResponse.json({ error: false, products: productData });
}

export async function POST(req = NextApiRequest) {
    const data = await req.json();
    console.log("Received data", data);
    let products = await saveProducts({ products: data.products, Products });
    return NextResponse.json({ error: false, products });
}
export async function DELETE(req = NextApiRequest) {
    const { product } = await req.nextUrl.searchParams;
    console.log("Deleting product", product);
    await Products.deleteOne({ _id: product });
    return NextResponse.json({ error: false });
}