import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PlatformDesign, PlatformItem } from "@pythias/mongo";
import { DesignsMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

const PER_PAGE = 48;

export default async function Designs(req) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const orgId = session.user.orgId;
    const query = await req.searchParams;
    const page = query.page ? parseInt(query.page) : 1;
    const q = query.q || null;

    const filter = q
        ? { orgId, $or: [{ sku: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }] }
        : { orgId };

    const [designs, count] = await Promise.all([
        PlatformDesign.find(filter)
            .sort({ _id: -1 })
            .skip((page - 1) * PER_PAGE)
            .limit(PER_PAGE)
            .lean(),
        PlatformDesign.countDocuments(filter),
    ]);

    const designIds = designs.map(d => d._id);
    const productCounts = await PlatformItem.aggregate([
        { $match: { orgId: orgId, designRef: { $in: designIds } } },
        { $group: { _id: "$designRef", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(productCounts.map(p => [p._id.toString(), p.count]));

    const designsWithCounts = designs.map(d => ({
        ...d,
        productCount: countMap[d._id.toString()] ?? 0,
    }));

    return (
        <DesignsMain
            designs={JSON.parse(JSON.stringify(designsWithCounts))}
            ct={count}
            pa={page}
            query={q}
            canEdit={true}
        />
    );
}
