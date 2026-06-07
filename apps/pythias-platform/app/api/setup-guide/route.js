import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
    SetupGuide,
    PlatformBlank, PlatformColor, PlatformDesign, PlatformProduct,
    PlatformMarketPlace, PlatformEditData, ApiKeyIntegrations,
} from "@pythias/mongo";

async function detectSteps(orgId, slug) {
    const [
        hasEditData,
        hasColors,
        hasBlanks,
        hasDesigns,
        hasProducts,
        hasIntegrations,
        hasMarketplace,
        hasListing,
    ] = await Promise.all([
        PlatformEditData.countDocuments({ orgId }),
        PlatformColor.countDocuments({ orgId }),
        PlatformBlank.countDocuments({ orgId }),
        PlatformDesign.countDocuments({ orgId }),
        PlatformProduct.countDocuments({ orgId }),
        ApiKeyIntegrations.countDocuments({ $or: [{ orgId }, { provider: slug }] }),
        PlatformMarketPlace.countDocuments({ orgId, connections: { $exists: true, $not: { $size: 0 } } }),
        PlatformProduct.countDocuments({ orgId, marketPlacesArray: { $exists: true, $not: { $size: 0 } } }),
    ]);

    return {
        dataCategories:   hasEditData   > 0,
        colors:           hasColors     > 0,
        firstBlank:       hasBlanks     > 0,
        firstDesign:      hasDesigns    > 0,
        firstProduct:     hasProducts   > 0,
        firstIntegration: hasIntegrations > 0,
        marketplace:      hasMarketplace > 0,
        firstListing:     hasListing    > 0,
    };
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.orgId;
    const slug  = session.user.orgSlug;

    const [guide, autoSteps] = await Promise.all([
        SetupGuide.findOne({ orgId }).lean(),
        detectSteps(orgId, slug),
    ]);

    const manual = guide?.manualSteps ?? {};
    const steps = {
        ...autoSteps,
        shippingHardware: !!manual.shippingHardware,
        internalServer:   !!manual.internalServer,
        fileWriter:       !!manual.fileWriter,
    };

    const total     = Object.keys(steps).length;
    const completed = Object.values(steps).filter(Boolean).length;

    return NextResponse.json({
        steps,
        completed,
        total,
        dismissed: guide?.dismissed ?? false,
        allDone:   completed === total,
    });
}

export async function PATCH(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orgId = session.user.orgId;
    const { step, value, dismissed } = await req.json();

    const update = {};
    if (dismissed !== undefined) update.dismissed = dismissed;
    if (step && ["shippingHardware", "internalServer", "fileWriter"].includes(step)) {
        update[`manualSteps.${step}`] = value ?? true;
    }

    await SetupGuide.findOneAndUpdate({ orgId }, { $set: update }, { upsert: true });
    return NextResponse.json({ success: true });
}
