import { Products } from "@pythias/mongo";
import { searchProducts, serialize } from "@pythias/backend";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const page    = parseInt(searchParams.get("page") ?? "1");
    const q       = searchParams.get("q") || null;
    const filters = searchParams.get("filters") ? JSON.parse(searchParams.get("filters")) : {};
    const { products, count } = await searchProducts({ Products, q, page, filters });
    return NextResponse.json({ products: serialize(products ?? []), count });
}
