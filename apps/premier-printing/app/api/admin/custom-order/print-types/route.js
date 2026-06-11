import { NextResponse } from "next/server";
import { PrintTypes } from "@pythias/mongo";

export async function GET() {
    const types = await PrintTypes.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ printTypes: types.map(t => ({ name: t.name, price: t.price || 0 })) });
}
