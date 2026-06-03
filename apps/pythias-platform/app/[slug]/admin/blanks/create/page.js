import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { PlatformBlank, PlatformColor, PlatformEditData } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { CreateBlank } from "@pythias/backend";

export const dynamic = "force-dynamic";

export default async function CreateBlankPage({ params, searchParams }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;
    const { id } = await searchParams;
    const orgId = session.user.orgId;

    if (!id) {
        const tempCode = `temp-${Date.now()}`;
        const blank = await PlatformBlank.create({ name: "New Blank", code: tempCode, orgId });
        redirect(`/${slug}/admin/blanks/create?id=${blank._id}`);
    }

    const blank = await PlatformBlank.findOne({ _id: id, orgId }).lean();
    if (!blank) return notFound();

    const [colors, blanks, printLocations, printTypes, vendors, departments, categories, brands, suppliers] = await Promise.all([
        PlatformColor.find({ orgId }).lean(),
        PlatformBlank.find({ orgId }).select("department category brand").lean(),
        PlatformEditData.find({ orgId, type: "printLocations" }).lean(),
        PlatformEditData.find({ orgId, type: "printTypes" }).lean(),
        PlatformEditData.find({ orgId, type: "vendors" }).lean(),
        PlatformEditData.find({ orgId, type: "departments" }).lean(),
        PlatformEditData.find({ orgId, type: "categories" }).lean(),
        PlatformEditData.find({ orgId, type: "brands" }).lean(),
        PlatformEditData.find({ orgId, type: "suppliers" }).lean(),
    ]);

    return (
        <CreateBlank
            colors={serialize(colors)}
            blanks={serialize(blanks)}
            bla={serialize(blank)}
            printPricing={null}
            locations={serialize(printLocations)}
            printTypes={serialize(printTypes)}
            vendors={serialize(vendors)}
            departments={serialize(departments)}
            categories={serialize(categories)}
            brands={serialize(brands)}
            suppliers={serialize(suppliers)}
        />
    );
}
