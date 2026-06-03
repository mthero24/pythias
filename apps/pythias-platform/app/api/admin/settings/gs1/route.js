import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Organization } from "@pythias/mongo";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const org = await Organization.findById(token.orgId).select("settings.gs1").lean();
    return NextResponse.json({ error: false, gs1: org?.settings?.gs1 ?? {} });
}

export async function PUT(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });

    const { apiKey, secondaryKey, accountNumber } = await req.json();
    await Organization.findByIdAndUpdate(token.orgId, {
        $set: {
            "settings.gs1.apiKey": apiKey ?? "",
            "settings.gs1.secondaryKey": secondaryKey ?? "",
            "settings.gs1.accountNumber": accountNumber ?? "",
        },
    });

    return NextResponse.json({ error: false });
}
