import { NextResponse } from "next/server";
import { PlatformProduct } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";

export async function GET(req, { params }) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const product = await PlatformProduct.findOne({ _id: id, orgId: token.orgId })
        .populate("design", "sku name printType images")
        .populate("blank", "code name colors sizes printLocations")
        .lean();

    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: false, product: JSON.parse(JSON.stringify(product)) });
}

export async function PATCH(req, { params }) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { product } = await req.json();
    delete product.orgId;

    try {
        const updated = await PlatformProduct.findOneAndUpdate(
            { _id: id, orgId: token.orgId },
            { $set: product },
            { new: true },
        ).lean();
        if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ error: false, product: JSON.parse(JSON.stringify(updated)) });
    } catch (e) {
        return NextResponse.json({ error: e.message?.includes("duplicate") ? "SKU already exists" : e.message });
    }
}

export async function DELETE(req, { params }) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await PlatformProduct.findOneAndDelete({ _id: id, orgId: token.orgId });
    return NextResponse.json({ error: false });
}
