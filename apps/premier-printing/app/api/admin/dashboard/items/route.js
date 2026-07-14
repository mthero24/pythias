import { NextResponse } from "next/server";
import { Order, Items, addCogs } from "@pythias/mongo";

const VALID_SORT_FIELDS = new Set(["date", "shipByDate", "styleCode", "colorName", "sizeName", "pieceId"]);

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

        // Exclude unpaid items (paid:false — e.g. unpaid custom orders); marketplace items are paid:true.
        const filter = { date: dateFilter, canceled: { $ne: true }, paid: { $ne: false }, ...(excludedIds.length ? { order: { $nin: excludedIds } } : {}) };
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

        const [rawItems, total, summaryAgg, dtfModeAgg, printModeAgg, shipModeAgg, stageDistAgg, rePullReasonsAgg] = await Promise.all([
            Items.find(filter)
                .select("date status steps printed treated folded shipped canceled rePulled inBin colorName sizeName styleCode pieceId batchID orderId poNumber order printedDate shippedDate shipByDate")
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
            // Stage counts: each item counted once at its latest step only
            Items.aggregate([
                { $match: filter },
                // Find last re-pull date (if any)
                { $addFields: {
                    lastRePullDate: {
                        $max: {
                            $map: {
                                input: { $filter: { input: { $ifNull: ["$steps", []] }, as: "s", cond: { $eq: ["$$s.status", "Re-Pulled"] } } },
                                as: "s", in: "$$s.date",
                            }
                        }
                    }
                }},
                // Effective steps: after last re-pull if re-pulled, otherwise all steps
                { $addFields: {
                    effectiveSteps: {
                        $cond: {
                            if: { $gt: ["$lastRePullDate", null] },
                            then: { $filter: { input: { $ifNull: ["$steps", []] }, as: "s", cond: { $and: [{ $ne: ["$$s.status", "Re-Pulled"] }, { $gt: ["$$s.date", "$lastRePullDate"] }] } } },
                            else: { $ifNull: ["$steps", []] },
                        }
                    }
                }},
                // Compute current stage using priority ranking
                { $addFields: {
                    latestStatus: {
                        $cond: {
                            if: { $and: [{ $gt: ["$lastRePullDate", null] }, { $eq: [{ $size: "$effectiveSteps" }, 0] }] },
                            then: "Re-Pulled",
                            else: {
                                $let: {
                                    vars: {
                                        best: {
                                            $reduce: {
                                                input: {
                                                    $map: {
                                                        input: "$effectiveSteps",
                                                        as: "s",
                                                        in: {
                                                            status: "$$s.status",
                                                            priority: { $switch: { branches: [
                                                                { case: { $in: ["$$s.status", ["Printed", "Label Printed", "label Printed"]] }, then: 1 },
                                                                { case: { $in: ["$$s.status", ["DTF Load", "Embroidery Load"]] }, then: 2 },
                                                                { case: { $eq: ["$$s.status", "DTF Find"] }, then: 3 },
                                                                { case: { $eq: ["$$s.status", "Folded"] }, then: 4 },
                                                                { case: { $eq: [{ $indexOfCP: [{ $ifNull: ["$$s.status", ""] }, "In Bin"] }, 0] }, then: 5 },
                                                                { case: { $in: ["$$s.status", ["Shipped", "PreShipped"]] }, then: 6 },
                                                            ], default: 0 } }
                                                        }
                                                    }
                                                },
                                                initialValue: { status: "Pending", priority: -1 },
                                                in: { $cond: { if: { $gt: ["$$this.priority", "$$value.priority"] }, then: "$$this", else: "$$value" } }
                                            }
                                        }
                                    },
                                    in: "$$best.status"
                                }
                            }
                        }
                    }
                }},
                { $group: {
                    _id: null,
                    dtfFind:      { $sum: { $cond: [{ $eq: ["$latestStatus", "DTF Find"] }, 1, 0] } },
                    dtfLoad:      { $sum: { $cond: [{ $in: ["$latestStatus", ["DTF Load", "Embroidery Load"]] }, 1, 0] } },
                    labelPrinted: { $sum: { $cond: [{ $eq: ["$latestStatus", "label Printed"] }, 1, 0] } },
                    folded:       { $sum: { $cond: [{ $eq: ["$latestStatus", "Folded"] }, 1, 0] } },
                    inBin:        { $sum: { $cond: [{ $eq: [{ $indexOfCP: [{ $ifNull: ["$latestStatus", ""] }, "In Bin"] }, 0] }, 1, 0] } },
                    rePulled:     { $sum: { $cond: [{ $eq: ["$latestStatus", "Re-Pulled"] }, 1, 0] } },
                    shipped:      { $sum: { $cond: [{ $in: ["$latestStatus", ["Shipped", "PreShipped"]] }, 1, 0] } },
                }},
            ]),
            Items.aggregate([
                { $match: { ...filter, canceled: { $ne: true }, rePulled: true } },
                { $unwind: "$rePulledReasons" },
                { $match: { rePulledReasons: { $exists: true, $ne: null, $gt: "" } } },
                { $group: { _id: "$rePulledReasons", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        const items = await addCogs(rawItems);

        const stageDist = stageDistAgg[0] ?? { dtfFind: 0, dtfLoad: 0, labelPrinted: 0, folded: 0, inBin: 0, rePulled: 0, shipped: 0 };
        const productionSummary = {
            ...(summaryAgg[0] ?? { total: 0, active: 0, shipped: 0, rePulled: 0, labelPrinted: 0, dtfLoad: 0, dtfFind: 0, avgDaysToLabel: null, avgDaysToPrint: null, avgDaysToShip: null }),
            // Stage counts: each item counted once at its latest step only
            dtfFind:      stageDist.dtfFind,
            dtfLoad:      stageDist.dtfLoad,
            labelPrinted: stageDist.labelPrinted,
            folded:       stageDist.folded,
            inBin:        stageDist.inBin,
            shipped:      stageDist.shipped,
            // Re-Pulled counts all items ever re-pulled (not just last step)
            rePulled:     summaryAgg[0]?.rePulled ?? 0,
            modeDtfLoad:     dtfModeAgg[0]?._id   ?? null,
            modePrintLabels: printModeAgg[0]?._id ?? null,
            modeDaysToShip:  shipModeAgg[0]?._id  ?? null,
            rePullReasons:   rePullReasonsAgg.map(r => ({ reason: r._id, count: r.count })),
        };

        if (csvMode) {
            const headers = ["Date", "PO Number", "Style", "Color", "Size", "Piece ID", "Wholesale Cost", "Stage"];
            const PRIO = { "Printed": 1, "Label Printed": 1, "label Printed": 1, "DTF Load": 2, "Embroidery Load": 2, "DTF Find": 3, "Folded": 4, "Shipped": 6, "PreShipped": 6 };
            const prio = (s) => s?.startsWith("In Bin") ? 5 : (PRIO[s] ?? 0);
            const stageOf = (i) => {
                if (!i.steps?.length) return "Pending";
                let steps = i.steps;
                const rePulls = steps.filter(s => s.status === "Re-Pulled");
                if (rePulls.length) {
                    const last = rePulls.reduce((a, b) => new Date(b.date) > new Date(a.date) ? b : a);
                    const after = steps.filter(s => s.status !== "Re-Pulled" && new Date(s.date) > new Date(last.date));
                    if (!after.length) return "Re-Pulled";
                    steps = after;
                }
                const best = steps.reduce((b, s) => prio(s.status) > prio(b?.status) ? s : b, steps[0]);
                const st = best?.status || "Pending";
                return st.startsWith("In Bin") ? "In Bin" : st;
            };
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
            productionSummary: { total: 0, active: 0, shipped: 0, rePulled: 0, labelPrinted: 0, folded: 0, inBin: 0, dtfLoad: 0, dtfFind: 0, avgDaysToLabel: null, avgDaysToPrint: null, avgDaysToShip: null, modeDtfLoad: null, modePrintLabels: null, modeDaysToShip: null, rePullReasons: [] },
        }, { status: 500 });
    }
}
