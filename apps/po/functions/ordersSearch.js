const LIMIT = 50;

export async function OrdersSearch({ Order, q, page = 1, statusFilter = {} }) {
    const skip = (page - 1) * LIMIT;
    const base = { "items.0": { $exists: true }, ...statusFilter };

    if (q?.trim()) {
        const regex = { $regex: q.trim().replace(/[^a-zA-Z0-9 ]/g, ""), $options: "i" };
        const findQuery = {
            ...base,
            $or: [
                { poNumber: regex },
                { "shippingAddress.name": regex },
                { "shippingAddress.city": regex },
                { "shippingAddress.state": regex },
            ],
        };
        const count = await Order.countDocuments(findQuery);
        const orders = await Order.find(findQuery)
            .sort({ date: -1 })
            .populate({ path: "items", populate: { path: "styleV2" } })
            .select("poNumber marketplace items status date productCost shippingCost shippingInfo shippingAddress shippingType orderId notes")
            .skip(skip)
            .limit(LIMIT)
            .lean();
        return { orders, count };
    }

    const count = await Order.countDocuments(base);
    const orders = await Order.find(base)
        .sort({ date: -1 })
        .populate({ path: "items", populate: { path: "styleV2" } })
        .select("poNumber marketplace items status date productCost shippingCost shippingInfo shippingAddress shippingType orderId notes")
        .skip(skip)
        .limit(LIMIT)
        .lean();
    return { orders, count };
}
