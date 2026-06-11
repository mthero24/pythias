import { NextResponse } from "next/server";
import { PlatformEditData as EditData } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(request) {
    const token = await getToken({ req: request });
    const orgId = token?.orgId;
    const locations = await EditData.find({ orgId, type: "printLocations" }).sort({ name: 1 }).lean();
    return NextResponse.json({ locations: locations.map(l => l.name).filter(Boolean) });
}
