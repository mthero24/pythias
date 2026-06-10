import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PlatformBlank, PlatformItem } from "@pythias/mongo";
import { BlanksComponent } from "@pythias/backend";
export const dynamic = "force-dynamic";

export default async function Blanks({ params }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const { slug } = await params;
    const orgId = session.user.orgId;

    const blanks = await PlatformBlank.find({ orgId }).lean().catch(() => []);
    const items = await PlatformItem.find({
        orgId,
        cancelled: false,
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).select("styleCode").lean().catch(() => []);

    const blanksWithSales = blanks.map(b => ({
        ...b,
        sales: items.filter(i => i.styleCode === b.code).length,
    }));

    return (
        <BlanksComponent
            blanks={JSON.parse(JSON.stringify(blanksWithSales))}
            mPs={[]}
            source="platform"
            orgId={orgId}
            basePath={`/${slug}/admin/blanks`}
        />
    );
}
