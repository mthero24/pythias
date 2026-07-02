import { NextResponse } from "next/server";
import { Organization } from "@pythias/mongo";
import { getToken } from "next-auth/jwt";

// Org-scoped internal production cost rates (COGS/margin). Read/write Organization.settings.
// productionCosts. Dot-notation $set so we never clobber the rest of the settings object.
export async function GET(request) {
    const token = await getToken({ req: request });
    const orgId = token?.orgId;
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const org = await Organization.findById(orgId).select("settings.productionCosts").lean();
    const r = org?.settings?.productionCosts || {};
    return NextResponse.json({
        productionCosts: {
            dtfInkRatePerSqIn: r.dtfInkRatePerSqIn || 0,
            dtgInkRatePerSqIn: r.dtgInkRatePerSqIn || 0,
            screenBurnRatePerScreen: r.screenBurnRatePerScreen || 0,
        },
    });
}

export async function PUT(request) {
    const token = await getToken({ req: request });
    const orgId = token?.orgId;
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const set = {};
    for (const k of ["dtfInkRatePerSqIn", "dtgInkRatePerSqIn", "screenBurnRatePerScreen"]) {
        if (body[k] !== undefined) set[`settings.productionCosts.${k}`] = Number(body[k]) || 0;
    }
    if (!Object.keys(set).length) return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    const org = await Organization.findByIdAndUpdate(orgId, { $set: set }, { new: true })
        .select("settings.productionCosts").lean();
    return NextResponse.json({ productionCosts: org?.settings?.productionCosts || {} });
}
