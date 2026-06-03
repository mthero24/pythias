import { NextResponse } from "next/server";
import { Order, Items, addCogs } from "@pythias/mongo";

const VALID_SORT_FIELDS = new Set(["date", "styleCode", "colorName", "sizeName", "pieceId"]);

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fromParam   = searchParams.get("from");
        const toParam     = searchParams.get("to");
        const marketplace = searchParams.get("marketplace");
        const csvMode     = searchParams.get("csv") === "1";
        const page        = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const pageSize    = csvMode ? 20000 : Math.min(200, Math.max(10, parseInt(searchParams.get("pageSize") || "50", 10)));
        const sortField   = VALID_SORT_FIELDS.has(searchParams.get("sort")) ? searchParams.get("sort") : "date";
        const sortDir     = searchParams.get("dir") === "asc" ? 1 : -1;

        const since = fromParam ? new Date(fromParam + "T00:00:00") : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const until = toParam   ? new Date(toParam   + "T23:59:59") : new Date();
        const dateFilter = { $gte: since, $lte: until };

        const excludedOrders = await Order.find({ date: dateFilter, status: { $in: ["Canceled", "Payment Failed"] } }).select("_id").lean();
        const excludedIds = excludedOrders.map(o => o._id);

        const filter = { date: dateFilter, canceled: { $ne: true }, ...(excludedIds.length ? { order: { $nin: excludedIds } } : {}) };
        if (marketplace && marketplace !== "All") {
            const orderDocs = await Order.find({ date: dateFilter, marketplace, status: { $nin: ["Canceled", "Payment Failed"] } }).select("_id").lean();
            filter.order = { $in: orderDocs.map(o => o._id) };
        }

        const activeFilter = { ...filter, canceled: { $ne: true } };

        const modeAgg = (field) => Items.aggregate([
            { $match: { ...activeFilter, [field]: { $exists: true, $ne: null } } },
            { $project: { day: { $floor: { $divide: [{ $subtract: [`$${field}`, "$date"] }, 86400000] } } } },
            { $group: { _id: "$day", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
        ]);

        const dtfStepDate = { $let: {
            vars: { dtf: { $arrayElemAt: [{ $filter: { input: { $ifNull: ["$steps", []] }, as: "s", cond: { $eq: ["$$s.status", "DTF Load"] } } }, 0] } },
            in: "$$dtf.date",
        }};

        const [rawItems, total, summaryAgg, dtfModeAgg, printModeAgg, shipModeAgg] = await Promise.all([
            Items.find(filter)
                .select("date status steps printed treated folded shipped canceled rePulled inBin colorName sizeName styleCode pieceId batchID orderId poNumber order printedDate shippedDate")
                .sort({ [sortField]: sortDir })
                .skip(csvMode ? 0 : (page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            csvMode ? Promise.resolve(0) : Items.countDocuments(filter),
            Items.aggregate([
                { $match: filter },
                { $group: {
                    _id: null,
                    total:        { $sum: 1 },
                    active:       { $sum: { $cond: [{ $ne: ["$canceled", true] }, 1, 0] } },
                    shipped:      { $sum: { $cond: { if: { $and: [{ $ne: ["$canceled", true] }, { $eq: ["$shipped",  true] }] }, then: 1, else: 0 } } },
                    rePulled:     { $sum: { $cond: { if: { $and: [{ $ne: ["$canceled", true] }, { $eq: ["$rePulled", true] }] }, then: 1, else: 0 } } },
                    labelPrinted: { $sum: { $cond: { if: { $and: [{ $ne: ["$canceled", true] }, { $eq: ["$labelPrinted", true] }] }, then: 1, else: 0 } } },
                    dtfLoad:      { $sum: { $cond: { if: { $and: [{ $ne: ["$canceled", true] }, { $eq: ["$status", "DTF Load"]       }] }, then: 1, else: 0 } } },
                    dtfFind:      { $sum: { $cond: { if: { $and: [{ $ne: ["$canceled", true] }, { $eq: ["$status", "DTF Find"]       }] }, then: 1, else: 0 } } },
                    avgDaysToLabel: { $avg: { $cond: { if: { $and: [{ $ne: ["$canceled", true] }, { $gt: [dtfStepDate, null] }] }, then: { $divide: [{ $subtract: [dtfStepDate, "$date"] }, 86400000] }, else: null } } },
                    avgDaysToPrint: { $avg: { $cond: { if: { $and: [{ $ne: ["$canceled", true] }, { $gt: ["$printedDate",  null] }] }, then: { $divide: [{ $subtract: ["$printedDate",  "$date"] }, 86400000] }, else: null } } },
                    avgDaysToShip:  { $avg: { $cond: { if: { $and: [{ $ne: ["$canceled", true] }, { $gt: ["$shippedDate",  null] }] }, then: { $divide: [{ $subtract: ["$shippedDate",  "$date"] }, 86400000] }, else: null } } },
                }},
            ]),
            Items.aggregate([
                { $match: activeFilter },
                { $project: { dtfDate: dtfStepDate } },
                { $match: { dtfDate: { $ne: null } } },
                { $project: { day: { $floor: { $divide: [{ $subtract: ["$dtfDate", "$date"] }, 86400000] } } } },
                { $group: { _id: "$day", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
            ]),
            modeAgg("printedDate"),
            modeAgg("shippedDate"),
        ]);

        const items = await addCogs(rawItems);

        const productionSummary = {
            ...(summaryAgg[0] ?? { total: 0, active: 0, shipped: 0, rePulled: 0, labelPrinted: 0, dtfLoad: 0, dtfFind: 0, avgDaysToLabel: null, avgDaysToPrint: null, avgDaysToShip: null }),
            modeDtfLoad:     dtfModeAgg[0]?._id   ?? null,
            modePrintLabels: printModeAgg[0]?._id ?? null,
            modeDaysToShip:  shipModeAgg[0]?._id  ?? null,
        };

        if (csvMode) {
            const headers = ["Date", "PO Number", "Style", "Color", "Size", "Piece ID", "Wholesale Cost", "Stage"];
            const stageOf = (i) => { if (!i.steps?.length) return "Pending"; const s = [...i.steps].sort((a, b) => new Date(b.date) - new Date(a.date))[0]; const st = s.status || "Pending"; return st.startsWith("In Bin") ? "In Bin" : st; };
            const rows = items.map(i => [
                i.date ? new Date(i.date).toLocaleDateString() : "",
                i.poNumber || i.orderId || "",
                i.styleCode    || "",
                i.colorName    || "",
                i.sizeName     || "",
                i.pieceId      || "",
                (i.wholesaleCost ?? 0).toFixed(2),
                stageOf(i),
            ]);
            const esc = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; };
            const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\r\n");
            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="production.csv"`,
                },
            });
        }

        return NextResponse.json({ items, total, page, pageSize, pages: Math.ceil(total / pageSize), productionSummary });
    } catch (e) {
        console.error("[dashboard/items] error:", e);
        return NextResponse.json({
            error: true, msg: e.message,
            items: [], total: 0, page: 1, pageSize: 50, pages: 0,
            productionSummary: { total: 0, active: 0, shipped: 0, rePulled: 0, labelPrinted: 0, dtfLoad: 0, dtfFind: 0, avgDaysToLabel: null, avgDaysToPrint: null, avgDaysToShip: null, modeDtfLoad: null, modePrintLabels: null, modeDaysToShip: null },
        }, { status: 500 });
    }
}
