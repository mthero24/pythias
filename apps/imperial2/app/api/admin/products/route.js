import {Products, Design} from "@pythias/mongo";
import {NextApiRequest, NextResponse } from "next/server";
import {saveProducts} from "@pythias/backend";
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