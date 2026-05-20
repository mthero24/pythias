import { NextResponse } from "next/server";
import { Items, Blank, Inventory, BlankForecastCache } from "@pythias/mongo";

const APP_KEY = "printthreads";

function monthKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function buildHistoricalMonths(since, until) {
    const months = [];
    const cur = new Date(since); cur.setDate(1); cur.setHours(0,0,0,0);
    const end = new Date(until); end.setDate(1);
    while (cur <= end) { months.push(monthKey(cur)); cur.setMonth(cur.getMonth()+1); }
    return months;
}

function fitLinear(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
    const sx = n*(n-1)/2, sx2 = n*(n-1)*(2*n-1)/6;
    const sy = values.reduce((a,b)=>a+b,0), sxy = values.reduce((a,v,i)=>a+i*v,0);
    const d = n*sx2 - sx*sx;
    const slope = d===0 ? 0 : (n*sxy-sx*sy)/d;
    return { slope, intercept: (sy-slope*sx)/n };
}

async function computeForecast() {
    const until = new Date(); until.setHours(23,59,59,999);
    const since = new Date(); since.setMonth(since.getMonth()-18); since.setHours(0,0,0,0);

    const monthlyAgg = await Items.aggregate([
        { $match: { date: { $gte: since, $lte: until }, canceled: { $ne: true } } },
        { $group: {
            _id: {
                styleCode: "$styleCode",
                colorName: "$colorName",
                sizeName:  "$sizeName",
                month: { $dateToString: { format: "%Y-%m", date: "$date" } },
            },
            qty: { $sum: 1 },
        }},
        { $project: { _id: 0, styleCode: "$_id.styleCode", colorName: "$_id.colorName", sizeName: "$_id.sizeName", month: "$_id.month", qty: 1 } },
    ]);

    const skuMap = {};
    for (const r of monthlyAgg) {
        const key = `${r.styleCode}||${r.colorName}||${r.sizeName}`;
        if (!skuMap[key]) skuMap[key] = { styleCode: r.styleCode, colorName: r.colorName, sizeName: r.sizeName, monthly: {} };
        skuMap[key].monthly[r.month] = (skuMap[key].monthly[r.month] || 0) + r.qty;
    }

    const historicalMonths = buildHistoricalMonths(since, until);
    const styleCodes = [...new Set(Object.values(skuMap).map(s => s.styleCode).filter(Boolean))];

    const [blanks, invDocs] = await Promise.all([
        Blank.find({ code: { $in: styleCodes } }).select("code sizes").lean(),
        Inventory.find({ style_code: { $in: styleCodes } })
            .select("style_code color_name size_name quantity pending_quantity order_at_quantity desired_order_quantity unit_cost")
            .lean(),
    ]);

    const costMap = {};
    for (const b of blanks) {
        costMap[b.code] = {};
        for (const sz of b.sizes ?? []) costMap[b.code][sz.name] = sz.wholesaleCost ?? 0;
    }
    const invMap = {};
    for (const inv of invDocs) {
        invMap[`${inv.style_code}||${inv.color_name}||${inv.size_name}`] = inv;
    }

    const forecastMonthLabels = Array.from({ length: 12 }, (_, h) => {
        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()+h+1);
        return monthKey(d);
    });

    const rows = Object.values(skuMap).map(sku => {
        const { styleCode, colorName, sizeName, monthly } = sku;
        const key = `${styleCode}||${colorName}||${sizeName}`;
        const values = historicalMonths.map(m => monthly[m] || 0);

        const last30  = values[values.length-1] || 0;
        const last90  = values.slice(-3).reduce((a,b)=>a+b,0);
        const last365 = values.reduce((a,b)=>a+b,0);
        const avgMonthly = Math.round(last365 / Math.max(1, historicalMonths.length));

        const { slope, intercept } = fitLinear(values);
        const n = values.length;
        const projMonths = Array.from({ length: 12 }, (_,h) => Math.max(0, Math.round(intercept + slope*(n+h))));
        const proj12mo = projMonths.reduce((a,b)=>a+b,0);

        const inv       = invMap[key];
        const onHand    = inv?.quantity         ?? null;
        const pending   = inv?.pending_quantity  ?? null;
        const reorderAt = inv?.order_at_quantity ?? null;
        const batchQty  = inv?.desired_order_quantity ?? null;
        const unitCost  = costMap[styleCode]?.[sizeName] ?? inv?.unit_cost ?? 0;

        const available = onHand != null ? (onHand + (pending || 0)) : null;
        const suggested = available != null ? Math.max(0, proj12mo - available) : null;
        const orderValue = suggested != null ? Math.round(suggested * unitCost * 100) / 100 : null;
        const belowReorderPoint = reorderAt != null && available != null && available <= reorderAt;

        return {
            styleCode, colorName, sizeName,
            last30, last90, last365, avgMonthly, proj12mo, projMonths,
            onHand, pending, reorderAt, batchQty, unitCost,
            suggested, orderValue, belowReorderPoint,
            needsReorder: (suggested != null && suggested > 0) || belowReorderPoint,
        };
    });

    rows.sort((a, b) => {
        if (a.needsReorder !== b.needsReorder) return a.needsReorder ? -1 : 1;
        return b.proj12mo - a.proj12mo;
    });

    return {
        rows,
        needsReorderCount:   rows.filter(r => r.needsReorder).length,
        totalSuggestedUnits: rows.reduce((s,r) => s+(r.suggested||0), 0),
        totalOrderValue:     rows.reduce((s,r) => s+(r.orderValue||0), 0),
        forecastMonthLabels,
    };
}

export async function GET() {
    try {
        const cached = await BlankForecastCache.findOne({ appKey: APP_KEY }).select("-_id -__v -appKey").lean();
        if (!cached) return NextResponse.json({ notReady: true, rows: [], needsReorderCount: 0, totalSuggestedUnits: 0, totalOrderValue: 0, forecastMonthLabels: [] });
        return NextResponse.json(cached);
    } catch(e) {
        console.error("[blanks-forecast GET]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await computeForecast();
        const computedAt = new Date();
        await BlankForecastCache.findOneAndUpdate(
            { appKey: APP_KEY },
            { appKey: APP_KEY, ...result, computedAt },
            { upsert: true, new: true }
        );
        return NextResponse.json({ ...result, computedAt });
    } catch(e) {
        console.error("[blanks-forecast POST]", e);
        return NextResponse.json({ error: true, msg: e.message }, { status: 500 });
    }
}
