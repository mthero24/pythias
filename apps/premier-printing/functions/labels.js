import {Items, Order, Batches} from "@pythias/mongo";
import {Sort} from "@pythias/labels";

export async function LabelsData(){
    // Phase 1: fire all queries in parallel, including gift items
    const [standardItems, expeditedItems, blankItems, giftItemsRaw, batches] = await Promise.all([
        Items.find({
            blank: { $ne: undefined },
            colorName: { $ne: null },
            sizeName: { $ne: null },
            designRef: { $ne: null },
            design: { $ne: null },
            labelPrinted: false,
            canceled: false,
            shipped: false,
            paid: true,
            stockStatus: { $ne: null },
            shippingType: { $ne: "Expedited" },
        }).populate("color", "name _id")
          .populate("designRef", "sku name printType")
          .populate("inventory.inventory", "row unit shelf bin quantity")
          .populate("inventory.productInventory", "location name")
          .lean(),
        Items.find({
            blank: { $ne: undefined },
            colorName: { $ne: null },
            sizeName: { $ne: null },
            designRef: { $ne: null },
            design: { $ne: null },
            labelPrinted: false,
            canceled: false,
            shipped: false,
            paid: true,
            stockStatus: { $ne: null },
            shippingType: "Expedited",
        }).populate("color", "name _id")
          .populate("designRef", "sku name printType")
          .populate("inventory.inventory", "row unit shelf bin quantity")
          .populate("inventory.productInventory", "location name")
          .lean(),
        Items.find({
            blank: { $ne: undefined },
            colorName: { $ne: null },
            sizeName: { $ne: null },
            isBlank: true,
            labelPrinted: false,
            canceled: false,
            shipped: false,
            paid: true,
            stockStatus: { $ne: null },
        }).populate("color", "name _id")
          .populate("designRef", "sku name printType")
          .populate("inventory.inventory", "row unit shelf bin quantity")
          .populate("inventory.productInventory", "location name")
          .lean(),
        Items.find({
            labelPrinted: false,
            canceled: false,
            paid: true,
            type: "gift",
        }).lean(),
        Batches.find({}).limit(20).sort({ _id: -1 }).lean(),
    ]);

    const labels = { Standard: [...standardItems, ...blankItems], WholeSale: expeditedItems };

    // Phase 2: one Order query covering ALL items + one for gifts — both in parallel
    const allItemOrderIds = [...standardItems, ...expeditedItems, ...blankItems].map(s => s.order);
    const giftOrderIds    = giftItemsRaw.map(s => s.order);

    const [orderList, giftOrderList] = await Promise.all([
        Order.find({ _id: { $in: allItemOrderIds } }).select("poNumber items marketplace date").lean(),
        Order.find({ _id: { $in: giftOrderIds } }).select("poNumber items").lean(),
    ]);

    const orderMap = new Map(orderList.map(o => [o._id.toString(), o]));

    let rePulls = 0;
    for (const k of Object.keys(labels)) {
        labels[k] = labels[k].map(s => {
            const order = orderMap.get(s.order?.toString());
            if (s.type == null) s.type = s.designRef?.printType ?? "DTF";
            // Whether this item's OOS image was already printed (so labels can be split from un-imaged ones).
            const oosImagePrinted = (s.steps || []).some(st => st.status === "OOS Image Sent");
            return { ...s, order, oosImagePrinted };
        }).filter(s => s.order != null);
        rePulls += labels[k].filter(l => l.rePulled).length;
    }

    // Phase 3: sort all categories in parallel
    await Promise.all(Object.keys(labels).map(async k => {
        labels[k] = await Sort(labels[k]);
    }));

    const giftOrderMap = new Map(giftOrderList.map(o => [o._id.toString(), o]));
    let giftMessages = giftItemsRaw
        .map(s => ({ ...s, order: giftOrderMap.get(s.order?.toString()), styleCode: "GIFT" }))
        .filter(s => s.order != null);

    return {
        labels:       JSON.parse(JSON.stringify(labels)),
        giftMessages: JSON.parse(JSON.stringify(giftMessages)),
        rePulls,
        batches:      JSON.parse(JSON.stringify(batches)),
    };
}
