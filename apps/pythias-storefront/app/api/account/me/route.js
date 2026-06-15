export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { StorefrontCustomer } from "@pythias/mongo";
import { resolveOrg } from "@/lib/resolveOrg";
import { bearer, verifyToken, publicCustomer } from "@/lib/auth";

// GET /api/account/me — current customer from the bearer token (scoped to this storefront).
export async function GET(req) {
    const ctx = await resolveOrg(req);
    if (!ctx) return NextResponse.json({ error: "Unknown storefront" }, { status: 404 });

    const claims = verifyToken(bearer(req));
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Token must belong to this storefront's org.
    if (String(claims.org) !== String(ctx.orgId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await StorefrontCustomer.findOne({ _id: claims.sub, orgId: ctx.orgId }).lean();
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json({ error: false, customer: publicCustomer(customer) });
}
