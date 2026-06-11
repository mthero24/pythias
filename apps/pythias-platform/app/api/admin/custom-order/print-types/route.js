import { NextResponse } from "next/server";
import { PrintTypes } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

export async function GET(request) {
    const token = await getToken({ req: request });
    const orgId = token?.orgId;
    const types = await PrintTypes.find({ orgId }).sort({ name: 1 }).lean();
    return NextResponse.json({ printTypes: types.map(t => ({ name: t.name, price: t.price || 0 })) });
}
