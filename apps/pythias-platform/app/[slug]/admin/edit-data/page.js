import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformEditData } from "@pythias/mongo";
import { serialize } from "@/functions/serialize";
import { Edit } from "@pythias/backend";

export const dynamic = "force-dynamic";

const TYPES = ["seasons", "genders", "themes", "sportUsedFor", "departments", "brands", "suppliers", "vendors", "printTypes", "repullReasons", "categories", "printLocations"];

export default async function EditDataPage() {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;

    const all = await PlatformEditData.find({ orgId }).lean();

    const grouped = {};
    for (const t of TYPES) grouped[t] = [];
    for (const item of all) {
        if (grouped[item.type]) grouped[item.type].push(item);
    }

    return <Edit data={serialize(grouped)} priceFields={["printTypes"]} />;
}
