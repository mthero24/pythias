import {Products, Design, Inventory} from "@pythias/mongo";
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
export async function PUT(req = NextApiRequest) {
    const data = await req.json();
    let product = await Products.findByIdAndUpdate(data.product._id, data.product, { new: true, returnNewDocument: true });
    product = await Products.findById(product._id).populate("design colors productImages.blank productImages.color productImages.threadColor threadColors").populate({ path: "blanks", populate: "colors" });
    console.log("Updated product", product);
    return NextResponse.json({ error: false, product });
}
export async function POST(req = NextApiRequest) {
    const data = await req.json();
    let products = await saveProducts({ products: data.products, Products, Inventory });
    return NextResponse.json({ error: false, products });
}
export async function DELETE(req = NextApiRequest) {
    const product = await req.nextUrl.searchParams.get("product");
    let prod = await Products.findOneAndDelete({ _id: product });
    return NextResponse.json({ error: false });
}