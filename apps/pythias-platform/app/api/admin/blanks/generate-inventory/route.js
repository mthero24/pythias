import { generateInventory } from "@/functions/generateInventory";
import { PlatformBlank as Blanks } from "@pythias/mongo";
import { NextApiRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req = NextApiRequest) {
    const token = await getToken({ req });
    const orgId = token?.orgId;
    let data = await req.json();
    let style = await Blanks.findOne({ _id: data.id, orgId });
    await generateInventory(style, orgId);
    return NextResponse.json({ style });
}
