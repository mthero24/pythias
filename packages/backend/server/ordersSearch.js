import { Items } from "@pythias/mongo";
import { Types } from "mongoose";

export const ORDERS_PER_PAGE = 25;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PIPE_MS   = 20000;
const SEARCH_MS = 10000;

const ITEM_PROJECT = {
    sku: 1, name: 1, colorName: 1, sizeName: 1, styleCode: 1,
    design: 1, isBlank: 1, color: 1, size: 1, blank: 1, upc: 1, pieceId: 1, price: 1,
};

const ORDER_PROJECT = {
    poNumber: 1, orderId: 1, marketplace: 1, items: 1, status: 1, date: 1,
    total: 1, productCost: 1, shippingCost: 1, discountAmount: 1, discountName: 1, shippingAddress: 1,
};

function pickHint(statusFilter) {
    if (statusFilter?.status) return { status: 1, date: -1 };
    return { date: -1 };
}

async function fetchPage(Order, matchFilter, skip, hint) {
    const [result] = await Order.aggregate([
        { $match: matchFilter },
        { $sort: { date: -1 } },
        {
            $facet: {
                count: [{ $count: "n" }],
                orders: [
                    { $skip: skip },
                    { $limit: ORDERS_PER_PAGE },
                    {
                        $lookup: {
                            from: "items",
                            localField: "items",
                            foreignField: "_id",
                            as: "items",
                            pipeline: [{ $project: ITEM_PROJECT }],
                        },
                    },
                    { $project: ORDER_PROJECT },
                ],
            },
        },
    ]).hint(hint).option({ maxTimeMS: PIPE_MS });

    return {
        orders: result?.orders ?? [],
        count:  result?.count?.[0]?.n ?? 0,
    };
}

export async function OrdersSearch({ Order, q, page = 1, statusFilter = {}, orderIds = null }) {
    const skip = (page - 1) * ORDERS_PER_PAGE;

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const searching          = Boolean(q?.trim());
    const dateLimit          = searching ? {} : { date: { $gte: since } };
    const activeStatusFilter = searching ? {} : statusFilter;
    const baseFilter         = { ...dateLimit, ...activeStatusFilter };
    if (orderIds) baseFilter._id = { $in: orderIds };

    if (!q?.trim()) {
        return fetchPage(Order, baseFilter, skip, pickHint(activeStatusFilter));
    }

    const raw   = q.trim();
    const idSet = new Set();
    const escaped = escapeRegex(raw);

    const poPromise = Order.find({
        ...baseFilter,
        $or: [
            { poNumber: raw },
            { poNumber: { $regex: `^${escaped}`, $options: "i" } },
        ],
    }).select("_id").limit(200).lean().maxTimeMS(SEARCH_MS).catch(() => []);

    const itemHitsPromise = Items.find({
        $or: [
            { pieceId: { $regex: escaped } },
            { sku:     { $regex: escaped } },
        ],
    }).select("order").limit(500).lean().maxTimeMS(SEARCH_MS).catch(() => []);

    const nameRegexPromise = Order.find({
        "shippingAddress.name": { $regex: escaped, $options: "i" },
    }).select("_id").limit(200).lean().maxTimeMS(SEARCH_MS).catch((e) => {
        console.error("[OrdersSearch] name regex failed:", e.message);
        return [];
    });

    let atlasPromise = Promise.resolve([]);
    if (raw.length > 2) {
        const sanitized = raw.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
        if (sanitized) {
            atlasPromise = Order.aggregate([
                {
                    $search: {
                        index: "default",
                        compound: {
                            must: [{
                                text: {
                                    query: sanitized,
                                    path: ["shippingAddress.name"],
                                    fuzzy: { maxEdits: 1, prefixLength: 2, maxExpansions: 50 },
                                },
                            }],
                        },
                    },
                },
                { $limit: 100 },
                { $project: { _id: 1 } },
            ], { maxTimeMS: SEARCH_MS }).catch((e) => {
                console.error("[OrdersSearch] Atlas Search failed:", e.message);
                return [];
            });
        }
    }

    const [poHits, itemHits, nameHits, atlasHits] = await Promise.all([
        poPromise, itemHitsPromise, nameRegexPromise, atlasPromise,
    ]);

    console.log(`[OrdersSearch] q="${raw}" poHits=${poHits.length} itemHits=${itemHits.length} nameHits=${nameHits.length} atlasHits=${atlasHits.length}`);

    poHits.forEach(h    => idSet.add(h._id.toString()));
    itemHits.forEach(h  => { if (h.order) idSet.add(h.order.toString()); });
    nameHits.forEach(h  => idSet.add(h._id.toString()));
    atlasHits.forEach(h => idSet.add(h._id.toString()));

    console.log(`[OrdersSearch] idSet size=${idSet.size}`);

    if (!idSet.size) return { orders: [], count: 0 };

    let matchIds = [...idSet];
    if (orderIds) {
        const allowed = new Set(orderIds.map(id => id.toString()));
        matchIds = matchIds.filter(id => allowed.has(id));
    }
    if (!matchIds.length) return { orders: [], count: 0 };

    const objectIds = matchIds.map(id => Types.ObjectId.createFromHexString(id));
    const matchFilter = { _id: { $in: objectIds }, ...activeStatusFilter };

    console.log(`[OrdersSearch] fetching page for ${objectIds.length} ids`);
    const { orders } = await fetchPage(Order, matchFilter, skip, { _id: 1 });
    console.log(`[OrdersSearch] fetchPage returned ${orders.length} orders`);

    return { orders, count: matchIds.length };
}
