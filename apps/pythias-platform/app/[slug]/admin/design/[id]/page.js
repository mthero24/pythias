import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";
import {
    PlatformDesign, PlatformBlank, PlatformColor, PlatformMarketPlace,
    PlatformLicenseHolder, PlatformEditData, PlatformProduct,
} from "@pythias/mongo";
import { DesignMain, serialize } from "@pythias/backend";
import { CreateSku } from "@/functions/CreateSku";

export const dynamic = "force-dynamic";

export default async function DesignPage({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { id, slug } = await params;
    const orgId = session.user.orgId;

    if (!id) return notFound();

    try {
        const [
            design,
            blanks,
            colors,
            marketPlaces,
            licenses,
            brands,
            genders,
            seasons,
            themes,
            sportUsedFor,
            printTypes,
            printLocations,
            products,
        ] = await Promise.all([
            PlatformDesign.findOne({ _id: id, orgId }).lean(),
            PlatformBlank.find({ orgId }).select("colors code name sizes images active department category printLocations hiddenColors").populate("colors").lean(),
            PlatformColor.find({ orgId }).lean(),
            PlatformMarketPlace.find({ orgId }).lean(),
            PlatformLicenseHolder.find({ orgId }).lean(),
            PlatformEditData.find({ orgId, type: "brands" }).lean(),
            PlatformEditData.find({ orgId, type: "genders" }).lean(),
            PlatformEditData.find({ orgId, type: "seasons" }).lean(),
            PlatformEditData.find({ orgId, type: "themes" }).lean(),
            PlatformEditData.find({ orgId, type: "sportUsedFor" }).lean(),
            PlatformEditData.find({ orgId, type: "printTypes" }).lean(),
            PlatformEditData.find({ orgId, type: "printLocations" }).lean(),
            PlatformProduct.find({ orgId, designRef: id }).lean(),
        ]);

        if (!design) return notFound();

        design.products = products;

        return (
            <DesignMain
                design={serialize(design)}
                bls={serialize(blanks)}
                brands={serialize(brands)}
                mPs={serialize(marketPlaces)}
                pI={[]}
                licenses={serialize(licenses)}
                colors={serialize(colors)}
                printLocations={serialize(printLocations)}
                seas={serialize(seasons)}
                gen={serialize(genders)}
                them={serialize(themes)}
                sport={serialize(sportUsedFor)}
                printTypes={serialize(printTypes)}
                source="platform"
                canEdit={true}
                CreateSku={CreateSku}
                designsPath={`/${slug}/admin/designs`}
            />
        );
    } catch (e) {
        console.error(e);
        return notFound();
    }
}
