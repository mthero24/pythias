import { generateEbayAuthUrl } from "@pythias/integrations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.redirect("/login");

    const { searchParams } = new URL(req.url);
    const sandbox = searchParams.get("sandbox") === "1";
    const debug   = searchParams.get("debug") === "1";

    // Encode orgId in state so the redirect callback can recover org context
    const orgId = session.user.orgId ?? "";
    const state = `${orgId}${sandbox ? ":sandbox" : ""}`;
    const url = generateEbayAuthUrl("", state, { sandbox });

    if (debug) return NextResponse.json({ url, sandbox, state });
    return NextResponse.redirect(url);
}
