import {Products, Design} from "@pythias/mongo";
import {NextApiRequest, NextResponse } from "next/server";
import {saveProducts} from "@pythias/backend";
export async function POST(req = NextApiRequest) {
    const data = await req.json();
    console.log("Received data", data);
    let products = await saveProducts({ products: data.products, Products });
    return NextResponse.json({ error: false, products });
}