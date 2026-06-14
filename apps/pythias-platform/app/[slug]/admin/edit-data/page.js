import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PlatformEditData, Organization } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { Edit } from "@pythias/backend";

export const dynamic = "force-dynamic";

const TYPES = ["seasons", "genders", "themes", "sportUsedFor", "departments", "suppliers", "vendors", "printTypes", "repullReasons", "categories", "printLocations"];

export default async function EditDataPage({ params }) {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;
    const { slug } = await params;

    // Commerce Cloud sellers inherit these settings from Premier (no Edit Data screen).
    const org = orgId ? await Organization.findById(orgId).select("orgType").lean() : null;
    if (org?.orgType === "commerce") redirect(`/${slug}/dashboard`);

    const all = await PlatformEditData.find({ orgId }).lean();

    const grouped = {};
    for (const t of TYPES) grouped[t] = [];
    for (const item of all) {
        if (grouped[item.type]) grouped[item.type].push(item);
    }

    return <Edit data={serialize(grouped)} priceFields={["printTypes"]} brandsPath={`/${slug}/admin/brands`} />;
}
