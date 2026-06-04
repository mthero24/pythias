import { PlatformItem, PlatformOrder, Batches } from "@pythias/mongo";
import { Sort } from "@pythias/labels";

export async function LabelsData(orgId) {
    const baseQuery = { orgId, labelPrinted: false, cancelled: false, paid: true };

    const [standardItems, expeditedItems, batches] = await Promise.all([
        PlatformItem.find({
            ...baseQuery,
            shippingType: { $ne: "Expedited" },
            designRef: { $ne: null },
            colorName: { $ne: null },
            sizeName: { $ne: null },
            stockStatus: "inStock",
        })
            .populate("designRef", "sku name printType")
            .populate("blank", "sizes singleShippingDimensions")
            .lean(),
        PlatformItem.find({
            ...baseQuery,
            shippingType: "Expedited",
            designRef: { $ne: null },
            colorName: { $ne: null },
            sizeName: { $ne: null },
            stockStatus: "inStock",
        })
            .populate("designRef", "sku name printType")
            .populate("blank", "sizes singleShippingDimensions")
            .lean(),
        Batches.find({}).limit(20).sort({ _id: -1 }).lean(),
    ]);

    const labels = { Standard: standardItems, WholeSale: expeditedItems };

    const allOrderIds = [...standardItems, ...expeditedItems].map(i => i.order);
    const orderList = await PlatformOrder.find({ _id: { $in: allOrderIds } })
        .select("poNumber items marketplace date")
        .lean();
    const orderMap = new Map(orderList.map(o => [o._id.toString(), o]));

    let rePulls = 0;
    for (const k of Object.keys(labels)) {
        labels[k] = labels[k]
            .map(item => {
                const order = orderMap.get(item.order?.toString());
                if (!order) return null;
                const type = item.type ?? item.designRef?.printType ?? "DTF";
                return { ...item, order, type };
            })
            .filter(Boolean);
        rePulls += labels[k].filter(l => l.repull).length;
        labels[k] = await Sort(labels[k]);
    }

    return {
        labels: JSON.parse(JSON.stringify(labels)),
        giftMessages: [],
        rePulls,
        batches: JSON.parse(JSON.stringify(batches)),
    };
}
