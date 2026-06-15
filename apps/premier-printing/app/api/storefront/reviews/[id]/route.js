export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { storefront } from "@pythias/backend/server";
import { premierAuthedOrg, svcError } from "@/lib/storefrontOrg";

export async function PUT(req, { params }) {
    const orgId = await premierAuthedOrg(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    try {
        if (b.action === "reply") return NextResponse.json({ error: false, review: await storefront.replyToReview(orgId, id, b.body) });
        const status = b.action === "publish" ? "published" : b.action === "reject" ? "rejected" : null;
        if (!status) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        return NextResponse.json({ error: false, review: await storefront.moderateReview(orgId, id, status) });
    } catch (e) { return svcError(e); }
}
