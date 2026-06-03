import { PlatformMarketPlace as MarketPlaces, PlatformBlank as Blank } from "@pythias/mongo";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function DELETE(req) {
    const token = await getToken({ req });
    if (!token?.permissions?.marketplaces) {
        return NextResponse.json({ error: true, msg: "Permission denied." }, { status: 403 });
    }
    const orgId = token.orgId;
    const { id } = await req.json();
    await MarketPlaces.findOneAndDelete({ _id: id, orgId });
    return NextResponse.json({ error: false });
}

export async function GET(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    const market = req.nextUrl.searchParams.get("marketPlace");
    const marketPlaces = await MarketPlaces.find(market ? { _id: market, orgId } : { orgId }).lean();
    return NextResponse.json({ error: false, marketPlaces });
}

export async function POST(req) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    const data = await req.json();
    if (data.marketPlace._id) {
        await MarketPlaces.findOneAndUpdate({ _id: data.marketPlace._id, orgId }, data.marketPlace, { new: true }).lean();
    } else {
        const nmp = new MarketPlaces({ ...data.marketPlace, orgId });
        await nmp.save();
    }
    if (data.blank) {
        await Blank.findOneAndUpdate({ _id: data.blank._id, orgId }, data.blank).lean();
    }
    const marketPlaces = await MarketPlaces.find({ orgId }).lean();
    return NextResponse.json({ error: false, marketPlaces });
}