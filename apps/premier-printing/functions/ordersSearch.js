const LIMIT = 200;

export async function OrdersSearch({ Order, q, page = 1, statusFilter = {}, orderIds = null }) {
    const skip = (page - 1) * LIMIT;

    if (q && q.trim().length > 2) {
        // Atlas Search — get all matching IDs, then apply extra filters in a regular find
        const hits = await Order.aggregate([
            {
                $search: {
                    index: "default",
                    text: {
                        query: q.replace(/[^a-zA-Z0-9 ]/g, "").trim(),
                        path: [
                            "poNumber",
                            "shippingAddress.name",
                            "shippingAddress.address1",
                            "shippingAddress.city",
                            "shippingAddress.state",
                            "shippingAddress.zip",
                        ],
                        fuzzy: { maxEdits: 2, prefixLength: 3, maxExpansions: 2 },
                        matchCriteria: "any",
                    },
                },
            },
            { $project: { _id: 1 } },
        ]);

        let ids = hits.map(h => h._id);

        // Intersect with orderIds filter (blank / missinginfo) if present
        if (orderIds) {
            const allowed = new Set(orderIds.map(id => id.toString()));
            ids = ids.filter(id => allowed.has(id.toString()));
        }

        const findQuery = { _id: { $in: ids }, "items.0": { $exists: true }, ...statusFilter };
        const count = await Order.countDocuments(findQuery);
        const orders = await Order.find(findQuery)
            .sort({ date: -1 })
            .populate("items")
            .select("poNumber marketplace items status date total")
            .skip(skip)
            .limit(LIMIT)
            .lean();

        return { orders, count };
    }

    // No query — regular find with filters
    const findQuery = { "items.0": { $exists: true }, ...statusFilter };
    if (orderIds) findQuery._id = { $in: orderIds };

    const count = await Order.countDocuments(findQuery);
    const orders = await Order.find(findQuery)
        .sort({ date: -1 })
        .populate("items")
        .select("poNumber marketplace items status date total")
        .skip(skip)
        .limit(LIMIT)
        .lean();

    return { orders, count };
}
