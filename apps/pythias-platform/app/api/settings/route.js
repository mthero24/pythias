import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Organization, PlatformUser } from "@pythias/mongo";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [org, users] = await Promise.all([
        Organization.findById(session.user.orgId).lean(),
        PlatformUser.find({ orgId: session.user.orgId, isActive: true }).select("-password").lean(),
    ]);

    return NextResponse.json({ org, users });
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowed = ['owner', 'admin'];
    if (!allowed.includes(session.user.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { orgName, timezone, bulkThreshold, returnAddress } = await req.json();
    const update = {};
    if (orgName) update.name = orgName;
    if (timezone) update['settings.timezone'] = timezone;
    if (bulkThreshold !== undefined) update['settings.bulkThreshold'] = Number(bulkThreshold);
    if (returnAddress && typeof returnAddress === "object") {
        for (const k of ["name", "businessName", "address", "address2", "city", "state", "postalCode", "country"]) {
            if (returnAddress[k] !== undefined) update[`returnAddress.${k}`] = returnAddress[k];
        }
    }

    await Organization.findByIdAndUpdate(session.user.orgId, update);
    return NextResponse.json({ ok: true });
}
