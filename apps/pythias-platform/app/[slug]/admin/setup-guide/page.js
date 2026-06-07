import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import {
    SetupGuide,
    PlatformBlank, PlatformColor, PlatformDesign, PlatformProduct,
    PlatformMarketPlace, PlatformEditData, ApiKeyIntegrations,
} from "@pythias/mongo";
import SetupGuideClient from "./SetupGuideClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Setup Guide" };

async function getSetupData(orgId, slug) {
    const [
        hasEditData, hasColors, hasBlanks, hasDesigns,
        hasProducts, hasIntegrations, hasMarketplace, hasListing, guide,
    ] = await Promise.all([
        PlatformEditData.countDocuments({ orgId }),
        PlatformColor.countDocuments({ orgId }),
        PlatformBlank.countDocuments({ orgId }),
        PlatformDesign.countDocuments({ orgId }),
        PlatformProduct.countDocuments({ orgId }),
        ApiKeyIntegrations.countDocuments({ $or: [{ orgId }, { provider: slug }] }),
        PlatformMarketPlace.countDocuments({ orgId, connections: { $exists: true, $not: { $size: 0 } } }),
        PlatformProduct.countDocuments({ orgId, marketPlacesArray: { $exists: true, $not: { $size: 0 } } }),
        SetupGuide.findOne({ orgId }).lean(),
    ]);

    const manual = guide?.manualSteps ?? {};
    return {
        dataCategories:   hasEditData      > 0,
        colors:           hasColors        > 0,
        firstBlank:       hasBlanks        > 0,
        firstDesign:      hasDesigns       > 0,
        firstProduct:     hasProducts      > 0,
        firstIntegration: hasIntegrations  > 0,
        marketplace:      hasMarketplace   > 0,
        firstListing:     hasListing       > 0,
        shippingHardware: !!manual.shippingHardware,
        internalServer:   !!manual.internalServer,
        fileWriter:       !!manual.fileWriter,
    };
}

export default async function SetupGuidePage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;
    const orgId    = session.user.orgId;

    const steps = await getSetupData(orgId, slug);
    const total     = Object.keys(steps).length;
    const completed = Object.values(steps).filter(Boolean).length;

    return (
        <SetupGuideClient
            steps={steps}
            completed={completed}
            total={total}
            slug={slug}
        />
    );
}
