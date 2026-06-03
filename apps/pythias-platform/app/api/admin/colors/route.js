import { NextApiRequest, NextResponse } from "next/server";
import { PlatformColor as Color } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let colors = await Color.find({ orgId }).lean();
    return NextResponse.json({ error: false, colors });
}

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let data = await req.json();
    let { color } = data;
    let exists = color?._id ? await Color.findOne({ _id: color._id, orgId }) : null;
    if (exists) {
        for (let key in color) {
            exists[key] = color[key];
        }
        await exists.save();
        return NextResponse.json({ color: exists });
    } else {
        let newColor = new Color({ ...color, orgId });
        await newColor.save();
        return NextResponse.json({ color: newColor });
    }
}

export async function PUT(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let data = await req.json();
    let { color } = data;
    await Color.findOneAndUpdate({ _id: color._id, orgId }, color);
    let colors = await Color.find({ orgId }).lean();
    return NextResponse.json({ error: false, colors });
}

export async function DELETE(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let id = req.nextUrl.searchParams.get("id");
    await Color.findOneAndDelete({ _id: id, orgId });
    let colors = await Color.find({ orgId }).lean();
    return NextResponse.json({ error: false, colors });
}
