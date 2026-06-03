import { PlatformItem } from "@pythias/mongo";
import { TrackLabels as TrackLabelsComponent, serialize } from "@pythias/backend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export const dynamic = "force-dynamic";

export default async function TrackLabels() {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.orgId;

    try {
        let items = await PlatformItem.find({
            orgId,
            labelPrinted: true,
            shipped: false,
            canceled: false,
            cancelled: false,
        })
            .populate("order", "poNumber status date preShipped notes")
            .sort({ _id: 1 })
            .lean();

        items = items.filter(item =>
            item.order &&
            item.order.status !== "canceled" &&
            item.order.status !== "returned" &&
            item.order.status !== "shipped" &&
            item.order.status !== "Shipped"
        );

        return <TrackLabelsComponent items={serialize(items)} source="platform" />;
    } catch (e) {
        console.error("[track-labels]", e);
        return <TrackLabelsComponent items={[]} source="platform" />;
    }
}
