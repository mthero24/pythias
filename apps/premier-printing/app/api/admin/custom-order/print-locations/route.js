import { NextResponse } from "next/server";
import { PrintLocations } from "@pythias/mongo";

export async function GET() {
    const locations = await PrintLocations.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ locations: locations.map(l => l.name).filter(Boolean) });
}
