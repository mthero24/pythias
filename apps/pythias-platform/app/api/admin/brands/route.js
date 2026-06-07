import { NextResponse } from "next/server";
import { PlatformBrand } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const orgId = token.orgId;

    const brands = await PlatformBrand.find({ orgId }).sort({ name: 1 }).lean();
    return NextResponse.json({ brands });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const orgId = token.orgId;

    const { name, description, logo } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: true, msg: "Name is required" }, { status: 400 });

    const brand = await PlatformBrand.create({ orgId, name: name.trim(), description, logo });
    const brands = await PlatformBrand.find({ orgId }).sort({ name: 1 }).lean();
    return NextResponse.json({ error: false, brand, brands });
}

export async function PATCH(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const orgId = token.orgId;

    const { id, name, description, logo } = await req.json();
    if (!id) return NextResponse.json({ error: true, msg: "id required" }, { status: 400 });

    const update = {};
    if (name !== undefined)        update.name        = name.trim();
    if (description !== undefined) update.description = description;
    if (logo !== undefined)        update.logo        = logo;

    const brand = await PlatformBrand.findOneAndUpdate({ _id: id, orgId }, { $set: update }, { new: true }).lean();
    const brands = await PlatformBrand.find({ orgId }).sort({ name: 1 }).lean();
    return NextResponse.json({ error: false, brand, brands });
}

export async function DELETE(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const orgId = token.orgId;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: true, msg: "id required" }, { status: 400 });

    await PlatformBrand.findOneAndDelete({ _id: id, orgId });
    const brands = await PlatformBrand.find({ orgId }).sort({ name: 1 }).lean();
    return NextResponse.json({ error: false, brands });
}
