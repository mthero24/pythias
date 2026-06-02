import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import { PlatformItem, PlatformOrder } from "@pythias/mongo";
import { getOrgCreds } from "@/lib/getOrgCreds";
import { Main } from "@pythias/sublimation";
import { Sort } from "@pythias/labels";
export const dynamic = "force-dynamic";

export default async function Sublimation(req) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const orgId = session.user.orgId;
    const creds = await getOrgCreds(orgId);
    const stations = creds.production?.shippingStations ?? [];

    const baseQuery = { orgId, cancelled: false, shipped: false, paid: true };

    const [sublimation, epson, posters] = await Promise.all([
        PlatformItem.find({ ...baseQuery, type: "sublimation", styleCode: { $nin: ["POST", "MSP", "CST"] } }).lean(),
        PlatformItem.find({ ...baseQuery, type: "sublimation", styleCode: { $in: ["CST", "MSP"] } }).lean(),
        PlatformItem.find({ ...baseQuery, type: "sublimation", styleCode: "POST" }).lean(),
    ]);

    const labelsRaw = { sublimation, epson, posters };
    const labels = {};

    for (const k of Object.keys(labelsRaw)) {
        const orderIds = labelsRaw[k].map(i => i.order);
        const orders = await PlatformOrder.find({ _id: { $in: orderIds } })
            .select("poNumber items status")
            .lean();
        const orderMap = new Map(orders.map(o => [o._id.toString(), o]));
        labels[k] = labelsRaw[k]
            .map(i => ({ ...i, order: orderMap.get(i.order?.toString()) }))
            .filter(i => i.order && i.order.status !== "Shipped" && i.order.status !== "Delivered");
        labels[k] = await Sort(labels[k]);
    }

    const params = await req.searchParams;
    const station = params.station;

    return (
        <Main
            labels={JSON.parse(JSON.stringify(labels))}
            stations={stations}
            stat={station}
        />
    );
}
