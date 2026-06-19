export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

// POST /api/storefront/menu — AI-design the header menu from the store's catalog + business info.
export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => null);
    try {
        const { links } = await storefront.generateMenu(orgId, { style: body?.style, target: body?.target });
        return NextResponse.json({ error: false, links });
    } catch (e) { return svcError(e); }
}
