import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { Organization } from "@pythias/mongo";

export const dynamic = "force-dynamic";

// GET  /api/admin/shipping/settings → { shippingLabels, returnAddress, walletBalanceCents }
// POST /api/admin/shipping/settings  Body: { enabled?, returnAddress?, defaultParcel? }
export async function GET(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org = await Organization.findById(token.orgId).select("shippingLabels returnAddress wallet").lean();
    return NextResponse.json({
        shippingLabels: org?.shippingLabels || { enabled: false, defaultParcel: {} },
        returnAddress: org?.returnAddress || {},
        walletBalanceCents: org?.wallet?.balance || 0,
    });
}

export async function POST(req) {
    const token = await getToken({ req });
    if (!token?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const $set = {};
    if (typeof body.enabled === "boolean") $set["shippingLabels.enabled"] = body.enabled;
    if (body.defaultParcel) for (const k of ["length", "width", "height", "weight"]) {
        if (body.defaultParcel[k] != null) $set[`shippingLabels.defaultParcel.${k}`] = Number(body.defaultParcel[k]) || 0;
    }
    if (body.returnAddress) for (const k of ["name", "businessName", "address", "address2", "city", "state", "postalCode", "country"]) {
        if (body.returnAddress[k] != null) $set[`returnAddress.${k}`] = body.returnAddress[k];
    }
    if (Object.keys($set).length) await Organization.updateOne({ _id: token.orgId }, { $set });
    const org = await Organization.findById(token.orgId).select("shippingLabels returnAddress wallet").lean();
    return NextResponse.json({ ok: true, shippingLabels: org.shippingLabels, returnAddress: org.returnAddress, walletBalanceCents: org?.wallet?.balance || 0 });
}
