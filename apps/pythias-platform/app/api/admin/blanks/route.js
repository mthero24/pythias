import { NextResponse } from "next/server";
import { PlatformBlank } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

const generateSizeSku = (name) => {
    if (!name) return "";
    const n = name.trim().toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
    const MAP = { small: "s", medium: "m", large: "l", xlarge: "xl", "2xlarge": "2xl", "3xlarge": "3xl", "4xlarge": "4xl", "5xlarge": "5xl", xxlarge: "2xl", xxxlarge: "3xl", xsmall: "xs" };
    return MAP[n] ?? n.substring(0, 5);
};

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

    if (Array.isArray(blank.sizes)) {
        for (const s of blank.sizes) {
            if (!s.sku) s.sku = generateSizeSku(s.name);
        }
    }

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
