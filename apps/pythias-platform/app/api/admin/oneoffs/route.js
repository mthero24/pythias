import { NextApiRequest, NextResponse } from "next/server";
import { PlatformEditData } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

const TYPES = ["seasons", "genders", "themes", "sportUsedFor", "departments", "brands", "suppliers", "vendors", "printTypes", "repullReasons", "categories", "printLocations"];

async function getAllByOrg(orgId) {
    const all = await PlatformEditData.find({ orgId }).lean();
    const grouped = {};
    for (const t of TYPES) grouped[t] = [];
    for (const item of all) {
        if (grouped[item.type]) grouped[item.type].push(item);
    }
    return grouped;
}

export async function GET(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    if (!orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const type = new URL(req.url).searchParams.get("type");
    if (type) {
        const items = await PlatformEditData.find({ orgId, type }).lean();
        return NextResponse.json({ error: false, [type]: items });
    }
    const grouped = await getAllByOrg(orgId);
    return NextResponse.json({ error: false, ...grouped });
}

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    const { type, value, price } = await req.json();
    if (!TYPES.includes(type) || !value?.trim()) {
        return NextResponse.json({ error: true, msg: "Invalid type or empty value" });
    }
    try {
        const doc = { orgId, type, name: value.trim() };
        if (price != null && !isNaN(parseFloat(price))) doc.price = parseFloat(price);
        await PlatformEditData.create(doc);
        const grouped = await getAllByOrg(orgId);
        return NextResponse.json({ error: false, ...grouped });
    } catch (e) {
        console.error("Error saving one-off", e);
        return NextResponse.json({ error: true, msg: `Error saving ${type}` });
    }
}

export async function DELETE(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    const id   = req.nextUrl.searchParams.get("id");
    const type = req.nextUrl.searchParams.get("type");
    try {
        await PlatformEditData.findOneAndDelete({ _id: id, orgId });
        const items = await PlatformEditData.find({ orgId, type }).lean();
        return NextResponse.json({ error: false, [type]: items });
    } catch (e) {
        console.error("Error deleting one-off", e);
        return NextResponse.json({ error: true, msg: `Error deleting ${type}` });
    }
}
