export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

export async function POST(req) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const b = await req.json().catch(() => ({}));
    try {
        if (b.action === "apply") return NextResponse.json({ error: false, ...(await storefront.applyMigration(orgId, b)) });
        return NextResponse.json({ error: false, ...(await storefront.migrateLinks(orgId, b)) });
    } catch (e) { return svcError(e); }
}
