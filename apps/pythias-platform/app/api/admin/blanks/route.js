import { NextResponse } from "next/server";
import { PlatformBlank } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const blanks = await PlatformBlank.find({ orgId: token.orgId }).lean();
    return NextResponse.json({ error: false, blanks });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { blank } = await req.json();
    blank.orgId = token.orgId;

    try {
        let saved;
        if (blank._id) {
            saved = await PlatformBlank.findOneAndUpdate(
                { _id: blank._id, orgId: token.orgId },
                blank,
                { new: true },
            );
        } else {
            saved = await PlatformBlank.create(blank);
        }
        return NextResponse.json({ error: false, blank: saved });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message });
    }
}

export async function DELETE(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    await PlatformBlank.findOneAndDelete({ _id: id, orgId: token.orgId });
    return NextResponse.json({ error: false });
}
