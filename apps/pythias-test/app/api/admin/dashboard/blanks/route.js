import { NextResponse } from "next/server";
import { Order, Items, Blank } from "@pythias/mongo";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fromParam   = searchParams.get("from");
        const toParam     = searchParams.get("to");
        const marketplace = searchParams.get("marketplace");

        const since = fromParam ? new Date(fromParam + "T00:00:00") : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const until = toParam   ? new Date(toParam   + "T23:59:59") : new Date();
        const dateFilter = { $gte: since, $lte: until };

        const filter = { date: dateFilter, canceled: { $ne: true } };
        if (marketplace && marketplace !== "All") {
            const orderDocs = await Order.find({ date: dateFilter, marketplace }).select("_id").lean();
            filter.order = { $in: orderDocs.map(o => o._id) };
        }

        const rows = await Items.aggregate([
            { $match: filter },
            { $group: {
                _id: { styleCode: "$styleCode", colorName: "$colorName", sizeName: "$sizeName" },
                qty: { $sum: 1 },
            }},
            { $project: {
                _id: 0,
                styleCode: "$_id.styleCode",
                colorName: "$_id.colorName",
                sizeName:  "$_id.sizeName",
                qty: 1,
            }},
            { $sort: { qty: -1 } },
        ]);

        const styleCodes = [...new Set(rows.map(r => r.styleCode).filter(Boolean))];
        const blanks     = await Blank.find({ code: { $in: styleCodes } }).select("code sizes").lean();

        const costMap = {};
        for (const b of blanks) {
            costMap[b.code] = {};
            for (const s of b.sizes ?? []) {
                costMap[b.code][s.name] = s.wholesaleCost ?? 0;
            }
        }

        const enriched = rows.map(r => {
            const unitCost  = costMap[r.styleCode]?.[r.sizeName] ?? 0;
            return { ...r, unitCost, totalCogs: unitCost * r.qty };
        });

        return NextResponse.json({ blanks: enriched });
    } catch (e) {
        console.error("[dashboard/blanks] error:", e);
        return NextResponse.json({ error: true, msg: e.message, blanks: [] }, { status: 500 });
    }
}
