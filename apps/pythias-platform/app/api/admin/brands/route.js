import { NextResponse } from "next/server";
import { Brands } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const brands = await Brands.find({ orgId: token.orgId }).select("name").sort({ name: 1 }).lean();
    return NextResponse.json({ brands });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const orgId = token.orgId;
    const data = await req.json();
    let brand = await Brands.findOneAndUpdate(
        { orgId, name: data.name },
        { orgId, name: data.name },
        { upsert: true, new: true },
    ).lean();
    const brands = await Brands.find({ orgId }).sort({ name: 1 }).lean();
    return NextResponse.json({ error: false, brands, brand });
}
