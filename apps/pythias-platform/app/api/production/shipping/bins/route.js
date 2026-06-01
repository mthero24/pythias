import { NextResponse } from "next/server";
import { PlatformBin } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
    const orgId = token.orgId;

    const [readyToShip, inUse] = await Promise.all([
        PlatformBin.find({ orgId, status: "ready" })
            .sort({ number: 1 })
            .populate({ path: "order", populate: "items" })
            .lean(),
        PlatformBin.find({ orgId, status: "in_use" })
            .sort({ number: 1 })
            .populate({ path: "order", populate: "items" })
            .lean(),
    ]);

    return NextResponse.json({
        bins: {
            readyToShip: JSON.parse(JSON.stringify(readyToShip)),
            inUse: JSON.parse(JSON.stringify(inUse)),
        },
    });
}
