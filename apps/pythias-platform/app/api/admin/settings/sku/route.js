import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Organization } from "@pythias/mongo";

const DEFAULT_FORMAT = {
    parts: ["blank.code", "color.sku", "size.sku", "design.sku"],
    separator: "_",
};

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const org = await Organization.findById(token.orgId).select("settings.skuFormat").lean();
    const format = org?.settings?.skuFormat ?? DEFAULT_FORMAT;
    return NextResponse.json({ error: false, format });
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { parts, separator } = await req.json();
    if (!Array.isArray(parts) || parts.length === 0)
        return NextResponse.json({ error: true, msg: "parts must be a non-empty array" }, { status: 400 });

    await Organization.findByIdAndUpdate(token.orgId, {
        $set: { "settings.skuFormat.parts": parts, "settings.skuFormat.separator": separator ?? "_" },
    });

    return NextResponse.json({ error: false });
}
