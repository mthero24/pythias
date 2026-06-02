import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { PlatformOrder, PlatformItem, PlatformBlank } from "@pythias/mongo";

const VALID_SORT_FIELDS = new Set(["date", "styleCode", "colorName", "sizeName", "pieceId"]);

async function addCogs(items, orgId) {
    if (!items.length) return items;
    const styleCodes = [...new Set(items.map(i => i.styleCode).filter(Boolean))];
    if (!styleCodes.length) return items.map(i => ({ ...i, wholesaleCost: 0 }));
    const blanks = await PlatformBlank.find({ orgId, code: { $in: styleCodes } }).select("code sizes").lean();
    const costMap = {};
    for (const b of blanks) { costMap[b.code] = {}; for (const sz of b.sizes ?? []) costMap[b.code][sz.name] = sz.wholesaleCost ?? 0; }
    return items.map(i => ({ ...i, wholesaleCost: costMap[i.styleCode]?.[i.sizeName] ?? 0 }));
}

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: true, msg: "Unauthorized" }, { status: 401 });
        const orgId = session.user.orgId;

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

        const baseFilter = { orgId, date: dateFilter };
        if (marketplace && marketplace !== "All") {
            const orderDocs = await PlatformOrder.find({ orgId, date: dateFilter, marketplace, cancelled: { $ne: true } }).select("_id").lean();
            baseFilter.order = { $in: orderDocs.map(o => o._id) };
        }

        const dtfStepDate = { $let: {
            vars: { dtf: { $arrayElemAt: [{ $filter: { input: { $ifNull: ["$steps", []] }, as: "s", cond: { $eq: ["$$s.status", "DTF Load"] } } }, 0] } },
            in: "$$dtf.date",
        }};

        const activeFilter = { ...baseFilter, cancelled: { $ne: true } };

        const [rawItems, total, summaryAgg, dtfModeAgg, printModeAgg, shipModeAgg] = await Promise.all([
            PlatformItem.find(baseFilter)
                .select("date status steps printed treated folded shipped cancelled repull colorName sizeName styleCode pieceId orderId poNumber order")
                .sort({ [sortField]: sortDir })
                .skip(csvMode ? 0 : (page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            csvMode ? Promise.resolve(0) : PlatformItem.countDocuments(baseFilter),
            PlatformItem.aggregate([
                { $match: baseFilter },
                { $group: {
                    _id: null,
                    total:        { $sum: 1 },
                    active:       { $sum: { $cond: [{ $ne: ["$cancelled", true] }, 1, 0] } },
                    shipped:      { $sum: { $cond: { if: { $and: [{ $ne: ["$cancelled", true] }, { $eq: ["$shipped",  true] }] }, then: 1, else: 0 } } },
                    rePulled:     { $sum: { $cond: { if: { $and: [{ $ne: ["$cancelled", true] }, { $eq: ["$repull",  true] }] }, then: 1, else: 0 } } },
                    treated:      { $sum: { $cond: { if: { $and: [{ $ne: ["$cancelled", true] }, { $eq: ["$treated",  true] }] }, then: 1, else: 0 } } },
                    labelPrinted: { $sum: { $cond: { if: { $and: [{ $ne: ["$cancelled", true] }, { $eq: ["$labelPrinted", true] }] }, then: 1, else: 0 } } },
                    dtfLoad:      { $sum: { $cond: { if: { $and: [{ $ne: ["$cancelled", true] }, { $eq: ["$status", "DTF Load"]  }] }, then: 1, else: 0 } } },
                    dtfFind:      { $sum: { $cond: { if: { $and: [{ $ne: ["$cancelled", true] }, { $eq: ["$status", "DTF Find"]  }] }, then: 1, else: 0 } } },
                    avgDaysToLabel: { $avg: { $cond: { if: { $and: [{ $ne: ["$cancelled", true] }, { $gt: [dtfStepDate, null] }] }, then: { $divide: [{ $subtract: [dtfStepDate, "$date"] }, 86400000] }, else: null } } },
                    avgDaysToPrint: { $avg: { $cond: { if: { $and: [{ $ne: ["$cancelled", true] }, { $gt: ["$printedDate",  null] }] }, then: { $divide: [{ $subtract: ["$printedDate",  "$date"] }, 86400000] }, else: null } } },
                    avgDaysToShip:  { $avg: { $cond: { if: { $and: [{ $ne: ["$cancelled", true] }, { $gt: ["$shippedDate",  null] }] }, then: { $divide: [{ $subtract: ["$shippedDate",  "$date"] }, 86400000] }, else: null } } },
                }},
            ]),
            PlatformItem.aggregate([
                { $match: activeFilter },
                { $project: { dtfDate: dtfStepDate } },
                { $match: { dtfDate: { $ne: null } } },
                { $project: { day: { $floor: { $divide: [{ $subtract: ["$dtfDate", "$date"] }, 86400000] } } } },
                { $group: { _id: "$day", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
            ]),
            PlatformItem.aggregate([
                { $match: { ...activeFilter, printedDate: { $exists: true, $ne: null } } },
                { $project: { day: { $floor: { $divide: [{ $subtract: ["$printedDate", "$date"] }, 86400000] } } } },
                { $group: { _id: "$day", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
            ]),
            PlatformItem.aggregate([
                { $match: { ...activeFilter, shippedDate: { $exists: true, $ne: null } } },
                { $project: { day: { $floor: { $divide: [{ $subtract: ["$shippedDate", "$date"] }, 86400000] } } } },
                { $group: { _id: "$day", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
            ]),
        ]);

        const items = await addCogs(rawItems, orgId);

        const productionSummary = {
            ...(summaryAgg[0] ?? { total: 0, active: 0, shipped: 0, rePulled: 0, treated: 0, labelPrinted: 0, dtfLoad: 0, dtfFind: 0, avgDaysToLabel: null, avgDaysToPrint: null, avgDaysToShip: null }),
            modeDtfLoad:     dtfModeAgg[0]?._id   ?? null,
            modePrintLabels: printModeAgg[0]?._id ?? null,
            modeDaysToShip:  shipModeAgg[0]?._id  ?? null,
        };

        if (csvMode) {
            const esc = (v) => { const s = String(v ?? ""); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; };
            const stageOf = (i) => { if (!i.steps?.length) return "Pending"; const s = [...i.steps].sort((a, b) => new Date(b.date) - new Date(a.date))[0]; return s.status || "Pending"; };
            const headers = ["Date", "PO Number", "Style", "Color", "Size", "Piece ID", "Wholesale Cost", "Stage"];
            const rows = items.map(i => [i.date ? new Date(i.date).toLocaleDateString() : "", i.poNumber || i.orderId || "", i.styleCode || "", i.colorName || "", i.sizeName || "", i.pieceId || "", (i.wholesaleCost ?? 0).toFixed(2), stageOf(i)]);
            const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\r\n");
            return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="production.csv"` } });
        }

        return NextResponse.json({ items, total, page, pageSize, pages: Math.ceil(total / pageSize), productionSummary });
    } catch (e) {
        console.error("[reports/items]", e);
        return NextResponse.json({ error: true, msg: e.message, items: [], total: 0, page: 1, pageSize: 50, pages: 0, productionSummary: { total: 0, active: 0, shipped: 0, rePulled: 0, treated: 0, labelPrinted: 0, dtfLoad: 0, dtfFind: 0, avgDaysToLabel: null, avgDaysToPrint: null, avgDaysToShip: null, modeDtfLoad: null, modePrintLabels: null, modeDaysToShip: null } }, { status: 500 });
    }
}
