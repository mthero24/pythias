import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Brands } from "@pythias/mongo";

export async function GET() {
    const brands = await Brands.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ brands });
}

export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { name, description, logo } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: true, msg: "Name is required" }, { status: 400 });

    const brand = await Brands.create({ name: name.trim(), description, logo, marketPlaces: [] });
    const brands = await Brands.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ error: false, brand, brands });
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { id, name, description, logo } = await req.json();
    if (!id) return NextResponse.json({ error: true, msg: "id required" }, { status: 400 });

    const update = {};
    if (name !== undefined)        update.name        = name.trim();
    if (description !== undefined) update.description = description;
    if (logo !== undefined)        update.logo        = logo;

    const brand = await Brands.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    const brands = await Brands.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ error: false, brand, brands });
}

export async function DELETE(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: true, msg: "id required" }, { status: 400 });

    await Brands.findByIdAndDelete(id);
    const brands = await Brands.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ error: false, brands });
}
