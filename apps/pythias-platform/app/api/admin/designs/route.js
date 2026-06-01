import { NextResponse } from "next/server";
import { PlatformDesign } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const PER_PAGE = 48;

    const filter = q
        ? { orgId: token.orgId, $or: [{ sku: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }] }
        : { orgId: token.orgId };

    const [designs, count] = await Promise.all([
        PlatformDesign.find(filter).sort({ _id: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).lean(),
        PlatformDesign.countDocuments(filter),
    ]);

    return NextResponse.json({ error: false, designs, count });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { design } = await req.json();
    design.orgId = token.orgId;

    try {
        let saved;
        if (design._id) {
            saved = await PlatformDesign.findOneAndUpdate(
                { _id: design._id, orgId: token.orgId },
                design,
                { new: true },
            );
        } else {
            saved = await PlatformDesign.create(design);
        }
        return NextResponse.json({ error: false, design: saved });
    } catch (e) {
        return NextResponse.json({ error: true, msg: e.message });
    }
}

export async function DELETE(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.searchParams.get("id");
    await PlatformDesign.findOneAndDelete({ _id: id, orgId: token.orgId });
    return NextResponse.json({ error: false });
}
